import { jsPDF } from 'jspdf';
import {
  PetRecord,
  DailyCheckIn,
  PetEvent,
  MedicationSchedule,
  DoseLog,
  CognitiveAssessmentLog,
  QoLAssessmentLog,
  WeeklyChangeBrief,
  CareCircleMember,
  MetricBaseline,
  EvaluatedCorrelationAlert,
} from '../types';
import { calculateBaselines } from './baselineEngine';
import { calculateMedicationAdherence } from './exportService';
import { resolveSpeciesPathway, getSpeciesPathwayCopy } from './speciesPathway';
import { getCognitiveQuestionsForSpecies, frequencyLabel } from './assessmentQuestions';
import { analyzeCognitiveTrends } from './cognitiveScheduler';
import {
  computeQoLPatternSummary,
  comparePersistence30vs90,
  QOL_FREQUENCY_DISCLAIMER,
} from './qolPatternService';
import { computePainAndAnxietySummary } from './correlationEngine';

export interface CompleteVetReportData {
  pet: PetRecord;
  checkIns: DailyCheckIn[];
  events: PetEvent[];
  medications: MedicationSchedule[];
  doses: DoseLog[];
  cognitiveLogs: CognitiveAssessmentLog[];
  qolLogs: QoLAssessmentLog[];
  brief: WeeklyChangeBrief;
  careCircle?: CareCircleMember[];
  ownerQuestions?: [string, string, string];
  correlations?: EvaluatedCorrelationAlert[];
  includeExtendedLog?: boolean;
}

// Sanitize strings to Latin-1 safe characters for standard jsPDF Helvetica font
function cleanText(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, ' -- ')
    .replace(/\u2013/g, '-')
    .replace(/\u2022/g, '*')
    .replace(/\u2713/g, '[OK]')
    .replace(/\u2265/g, '>=')
    .replace(/\u2264/g, '<=')
    .replace(/\u2191/g, '[UP]')
    .replace(/\u2193/g, '[DN]')
    .replace(/\u2192/g, '->')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

function formatDateShort(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[1]}/${parts[2]}`;
}

function renderWellBeingTrendCanvas(checkIns: DailyCheckIn[]): string | null {
  if (typeof document === 'undefined') return null;
  const width = 960;
  const height = 320;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 18px Helvetica, Arial, sans-serif';
  ctx.fillText('30-Day Daily Check-In Trends (Scale 1-5)', 24, 34);

  const sorted = [...checkIns].sort((a, b) => a.timestamp - b.timestamp).slice(-30);
  if (sorted.length < 2) {
    ctx.fillStyle = '#64748B';
    ctx.font = '15px Helvetica, Arial, sans-serif';
    ctx.fillText('Insufficient check-in history to plot 30-day trend (minimum 2 check-ins required).', 24, 165);
    return canvas.toDataURL('image/png');
  }

  const series = [
    { key: 'mobilityStiffness' as const, label: 'Mobility', color: '#B45309', width: 3.5 },
    { key: 'comfortPain' as const, label: 'Comfort', color: '#047857', width: 2.5 },
    { key: 'appetite' as const, label: 'Appetite', color: '#1D4ED8', width: 2.5 },
    { key: 'energyActivity' as const, label: 'Energy', color: '#6D28D9', width: 2 },
    { key: 'waterIntake' as const, label: 'Water Intake', color: '#0E7490', width: 2 },
  ];

  let lx = 24;
  ctx.font = 'bold 13px Helvetica, Arial, sans-serif';
  series.forEach((s) => {
    ctx.fillStyle = s.color;
    ctx.fillRect(lx, 50, 16, 6);
    ctx.fillStyle = '#334155';
    ctx.fillText(s.label, lx + 22, 58);
    lx += ctx.measureText(s.label).width + 48;
  });

  const padLeft = 56;
  const padRight = 28;
  const padTop = 78;
  const padBottom = 46;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  for (let v = 1; v <= 5; v++) {
    const y = padTop + plotH - ((v - 1) / 4) * plotH;
    ctx.strokeStyle = v === 3 ? '#CBD5E1' : '#E2E8F0';
    ctx.lineWidth = v === 3 ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(padLeft + plotW, y);
    ctx.stroke();
    ctx.fillStyle = '#64748B';
    ctx.font = '13px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String(v), padLeft - 10, y + 5);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748B';
  ctx.font = '12px Helvetica, Arial, sans-serif';
  const tickStep = Math.max(1, Math.floor(sorted.length / 6));
  sorted.forEach((c, idx) => {
    if (idx % tickStep === 0 || idx === sorted.length - 1) {
      const x = padLeft + (idx / (sorted.length - 1)) * plotW;
      ctx.fillText(formatDateShort(c.date), x, height - 16);
    }
  });

  series.forEach((s) => {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    sorted.forEach((c, idx) => {
      const val = Math.max(1, Math.min(5, c[s.key]));
      const x = padLeft + (idx / (sorted.length - 1)) * plotW;
      const y = padTop + plotH - ((val - 1) / 4) * plotH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });

  ctx.textAlign = 'left';
  return canvas.toDataURL('image/png');
}

function renderRespiratoryCanvas(checkIns: DailyCheckIn[]): string | null {
  if (typeof document === 'undefined') return null;
  const samples = [...checkIns]
    .filter((c) => typeof c.restingBreathingRate === 'number' && !isNaN(c.restingBreathingRate))
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-15);
  if (samples.length === 0) return null;

  const width = 960;
  const height = 210;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 17px Helvetica, Arial, sans-serif';
  ctx.fillText('Sleeping Respiratory Rate Trend (Breaths / Min vs. 30 br/min Threshold)', 24, 32);

  const padL = 56;
  const padR = 32;
  const padT = 56;
  const padB = 40;
  const pW = width - padL - padR;
  const pH = height - padT - padB;
  const vals = samples.map((s) => s.restingBreathingRate!);
  const maxVal = Math.max(36, Math.ceil(Math.max(...vals) + 4));
  const minVal = 10;
  const range = maxVal - minVal;

  const threshY = padT + pH - ((30 - minVal) / range) * pH;
  ctx.strokeStyle = '#DC2626';
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padL, threshY);
  ctx.lineTo(padL + pW, threshY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  samples.forEach((s, idx) => {
    const x = samples.length === 1 ? padL + pW / 2 : padL + (idx / (samples.length - 1)) * pW;
    const y = padT + pH - ((s.restingBreathingRate! - minVal) / range) * pH;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  samples.forEach((s, idx) => {
    const x = samples.length === 1 ? padL + pW / 2 : padL + (idx / (samples.length - 1)) * pW;
    const y = padT + pH - ((s.restingBreathingRate! - minVal) / range) * pH;
    ctx.fillStyle = s.restingBreathingRate! > 30 ? '#DC2626' : '#047857';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  return canvas.toDataURL('image/png');
}

export function buildPreVisitBriefPdfDoc(data: CompleteVetReportData): jsPDF {
  const {
    pet,
    checkIns,
    events,
    medications,
    doses,
    cognitiveLogs,
    brief,
    ownerQuestions = ['', '', ''],
    correlations = [],
    includeExtendedLog = false,
  } = data;

  const pathway = resolveSpeciesPathway(pet);
  const copy = getSpeciesPathwayCopy(pathway);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186mm
  const reportDate = new Date().toISOString().split('T')[0];

  const adherence30d = calculateMedicationAdherence(doses, 30);
  const baselines: MetricBaseline[] = calculateBaselines(checkIns, pathway);
  const top3Changes = [...baselines]
    .filter((b) => b.hasSufficientBaseline)
    .sort((a, b) => Math.abs(b.percentDeviation) - Math.abs(a.percentDeviation))
    .slice(0, 3);

  const cogQuestions = getCognitiveQuestionsForSpecies(pathway);
  const last3Cog = [...cognitiveLogs].sort((a, b) => a.timestamp - b.timestamp).slice(-3);
  const cogTrend = analyzeCognitiveTrends(pathway, cognitiveLogs);
  const painAnxiety = computePainAndAnxietySummary({ pet, checkIns, events, medications, doses });
  const summary30 = computeQoLPatternSummary(checkIns, 30);
  const summary90 = computeQoLPatternSummary(checkIns, 90);
  const persistenceNote = comparePersistence30vs90(summary30, summary90);

  let y = 10;

  const drawCompactBanner = (num: string, title: string) => {
    doc.setFillColor(245, 242, 235);
    doc.setDrawColor(213, 208, 196);
    doc.rect(margin, y, contentWidth, 5.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(31, 36, 33);
    doc.text(cleanText(`${num}. ${title.toUpperCase()}`), margin + 2.5, y + 3.9);
    y += 7.2;
  };

  // =========================================================================
  // PAGE 1: DEFAULT 1-PAGE PRE-VISIT VET BRIEF (EXACTLY 7 ORDERED SECTIONS)
  // =========================================================================
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 15.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(
    cleanText(`PRE-VISIT VETERINARY BRIEF: ${pet.name.toUpperCase()} (${copy.speciesLabel.toUpperCase()})`),
    margin + 3.5,
    y + 6.2
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(226, 232, 240);
  const ageLabel = pet.age_unknown
    ? 'Age Unknown'
    : `${pet.ageYears} yrs${pet.age_estimated ? ' (estimated)' : ''}`;
  doc.text(
    cleanText(
      `Species: ${copy.speciesLabel} | Breed: ${pet.breed} | ${ageLabel} | Sex/Neuter: ${pet.neuterStatus} | Generated: ${reportDate}`
    ),
    margin + 3.5,
    y + 11.8
  );
  y += 18;

  // SECTION 1: Pet Snapshot
  drawCompactBanner('1', 'Pet Snapshot & 30-Day Medication Adherence');
  const sortedWeights = [...(pet.weightHistory || [])].sort((a, b) => a.date.localeCompare(b.date));
  const weightTrendText =
    sortedWeights.length >= 2
      ? `${sortedWeights[0].weightKg}kg (${sortedWeights[0].date}) -> ${pet.currentWeightKg}kg (current)`
      : `${pet.currentWeightKg} kg`;
  const activeMedsStr =
    medications.length > 0
      ? medications.map((m) => `${m.name} (${m.dosage}, ${m.frequency})`).join('; ')
      : 'None active';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(30, 41, 59);
  const s1Line1 = cleanText(
    `Weight Trend: ${weightTrendText}  |  Known Conditions: ${pet.knownConditions.join(', ') || 'None noted'}  |  30-Day Overall Med Adherence: ${adherence30d}%`
  );
  const s1Lines1 = doc.splitTextToSize(s1Line1, contentWidth - 4);
  doc.text(s1Lines1, margin + 2, y);
  y += s1Lines1.length * 3.5 + 0.6;

  const s1Line2 = cleanText(`Active Medications: ${activeMedsStr}`);
  const s1Lines2 = doc.splitTextToSize(s1Line2, contentWidth - 4).slice(0, 2);
  doc.text(s1Lines2, margin + 2, y);
  y += s1Lines2.length * 3.5 + 2.5;

  // SECTION 2: Top Three Changes in Last 30 Days
  drawCompactBanner('2', 'Top Three Changes in Last 30 Days');
  if (top3Changes.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.8);
    doc.text(
      cleanText(`Still learning ${pet.name}'s normal 30-day baseline (fewer than 5 logged days).`),
      margin + 2,
      y
    );
    y += 5;
  } else {
    top3Changes.forEach((dev, idx) => {
      const sign = dev.percentDeviation > 0 ? `+${dev.percentDeviation}%` : `${dev.percentDeviation}%`;
      const rowText = cleanText(
        `${idx + 1}. ${dev.metricLabel} (${dev.dateRangeLabel || 'Last 30d'}): 7d avg ${dev.mean7d} vs 30d avg ${dev.mean30d} (${sign}) -- ${dev.interpretation}`
      );
      const rLines = doc.splitTextToSize(rowText, contentWidth - 4).slice(0, 2);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.6);
      doc.setTextColor(30, 41, 59);
      doc.text(rLines, margin + 2, y);
      y += rLines.length * 3.4 + 0.8;
    });
  }
  y += 1.5;

  // SECTION 3: Cognitive Trend Summary (DISHAA for Dog | VISHDAAL for Cat)
  drawCompactBanner('3', copy.vetBriefLabels.cognitiveSectionTitle);
  if (last3Cog.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.8);
    doc.text(cleanText(`No ${copy.cognitiveInstrument} cognitive screens completed yet.`), margin + 2, y);
    y += 5;
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(146, 64, 14);
    const reliabilityLine = cleanText(
      `Instrument: ${copy.cognitiveInstrument} | Screens Shown: ${last3Cog.length} of last 3 | ${cogTrend.overallPlainSummary}${
        !cogTrend.hasReliableTrend ? ' (More screens needed for a reliable trend)' : ''
      }`
    );
    const relLines = doc.splitTextToSize(reliabilityLine, contentWidth - 4).slice(0, 2);
    doc.text(relLines, margin + 2, y);
    y += relLines.length * 3.4 + 1.2;

    // Compact table header for last 3 screens
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 4.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text('Dimension', margin + 2, y + 3.4);
    last3Cog.forEach((sc, idx) => {
      doc.text(cleanText(sc.date), margin + 62 + idx * 32, y + 3.4);
    });
    doc.text('Direction', margin + 160, y + 3.4);
    y += 4.8;

    cogQuestions.forEach((q, qIdx) => {
      if (qIdx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 4.2, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      doc.text(cleanText(q.dimensionLabel), margin + 2, y + 3.1);

      last3Cog.forEach((sc, idx) => {
        const val = sc.per_dimension_scores?.[q.dimensionKey];
        const lbl = val === null || val === undefined ? 'Not sure' : `${frequencyLabel(val)} (${val}/4)`;
        doc.text(cleanText(lbl), margin + 62 + idx * 32, y + 3.1);
      });

      const dimTrend = cogTrend.dimensionTrends.find((d) => d.dimensionKey === q.dimensionKey);
      const dirText =
        dimTrend?.direction === 'worsening'
          ? '[UP] Increased'
          : dimTrend?.direction === 'improving'
          ? '[DN] Eased'
          : dimTrend?.direction === 'not_sure'
          ? 'Not sure'
          : '-> Steady';
      doc.text(cleanText(dirText), margin + 160, y + 3.1);
      y += 4.2;
    });
  }
  y += 2;

  // SECTION 4: Pain & Anxiety Summary
  drawCompactBanner('4', 'Pain & Anxiety Summary (Last 30 Days)');
  const painMedsLine =
    painAnxiety.painAnxietyMeds.length > 0
      ? painAnxiety.painAnxietyMeds.map((m) => `${m.name}: ${m.adherence30d}% adherence`).join(' | ')
      : 'No active pain or anxiety prescriptions logged';
  const s4Text = cleanText(
    `Comfort Rating: ${painAnxiety.comfortTrendText}. 30d Logged Pain/Mobility Events: ${painAnxiety.painEventCount30d} | Anxiety/Restless Events: ${painAnxiety.anxietyEventCount30d}. Pain/Anxiety Med Adherence: ${painMedsLine}.`
  );
  const s4Lines = doc.splitTextToSize(s4Text, contentWidth - 4).slice(0, 3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(30, 41, 59);
  doc.text(s4Lines, margin + 2, y);
  y += s4Lines.length * 3.5 + 2;

  // SECTION 5: Owner-Reported Correlations ("Patterns the owner noticed" — ONLY appears here!)
  drawCompactBanner('5', 'Patterns the Owner Noticed (Non-Diagnostic Correlations)');
  if (correlations.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.6);
    doc.setTextColor(71, 85, 105);
    doc.text(
      cleanText('No co-occurring 14-day pain, anxiety, adherence, or cognitive patterns flagged in this period.'),
      margin + 2,
      y
    );
    y += 5;
  } else {
    correlations.slice(0, 3).forEach((c) => {
      const cText = cleanText(
        `* ${c.title}: ${c.adherencePromptFirst ? `${c.adherencePromptFirst} ` : ''}${c.promptText} [${c.evidenceSummary}]`
      );
      const cLines = doc.splitTextToSize(cText, contentWidth - 4).slice(0, 2);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.4);
      doc.setTextColor(30, 41, 59);
      doc.text(cLines, margin + 2, y);
      y += cLines.length * 3.3 + 0.8;
    });
  }
  y += 1.5;

  // SECTION 6: Owner's Three Questions
  drawCompactBanner('6', "Owner's Three Questions for Today's Consultation");
  const trimmedQs = ownerQuestions.map((q) => q.trim()).filter(Boolean);
  if (trimmedQs.length === 0) {
    const fallbackQ = cleanText(
      `1. ${brief.vetQuestion}  (Owner skipped custom questions; derived from weekly change brief.)`
    );
    const fLines = doc.splitTextToSize(fallbackQ, contentWidth - 4).slice(0, 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(30, 41, 59);
    doc.text(fLines, margin + 2, y);
    y += fLines.length * 3.5 + 2;
  } else {
    for (let i = 0; i < 3; i++) {
      const qVal = ownerQuestions[i]?.trim();
      if (!qVal) continue;
      const qLines = doc.splitTextToSize(cleanText(`${i + 1}. ${qVal}`), contentWidth - 4).slice(0, 2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.6);
      doc.setTextColor(30, 41, 59);
      doc.text(qLines, margin + 2, y);
      y += qLines.length * 3.4 + 0.7;
    }
    y += 1.5;
  }

  // SECTION 7: Quality of Life & Good-Day / Bad-Day Pattern
  drawCompactBanner('7', 'Quality of Life & Good-Day / Bad-Day Pattern Summary');
  const s7Line1 = cleanText(
    `30-Day Logged Pattern: ${summary30.goodDays} Good, ${summary30.badDays} Harder/Bad (${summary30.unloggedDays} unlogged days excluded) -- ${summary30.proportionText}`
  );
  const s7Line2 = cleanText(
    `90-Day Logged Pattern: ${summary90.goodDays} Good, ${summary90.badDays} Harder/Bad (${summary90.unloggedDays} unlogged) -- Band: ${summary90.bandLabel}. ${persistenceNote}`
  );
  const s7Disclaimer = cleanText(`Note: ${QOL_FREQUENCY_DISCLAIMER}`);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  const l1 = doc.splitTextToSize(s7Line1, contentWidth - 4).slice(0, 2);
  doc.text(l1, margin + 2, y);
  y += l1.length * 3.4 + 0.6;
  const l2 = doc.splitTextToSize(s7Line2, contentWidth - 4).slice(0, 2);
  doc.text(l2, margin + 2, y);
  y += l2.length * 3.4 + 0.8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(146, 64, 14);
  doc.text(s7Disclaimer, margin + 2, y);
  y += 4.5;

  // =========================================================================
  // OPTIONAL PAGE 2+: EXTENDED VERSION WITH CHARTS & FULL EVENT LOG
  // =========================================================================
  if (includeExtendedLog) {
    doc.addPage();
    y = 14;
    const ensureSpace = (neededMm: number) => {
      if (y + neededMm > pageHeight - 18) {
        doc.addPage();
        y = 14;
      }
    };

    const drawExtendedHeader = (title: string) => {
      ensureSpace(12);
      doc.setFillColor(245, 242, 235);
      doc.setDrawColor(213, 208, 196);
      doc.rect(margin, y, contentWidth, 6.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(31, 36, 33);
      doc.text(cleanText(title.toUpperCase()), margin + 3, y + 4.5);
      y += 9;
    };

    drawExtendedHeader(`Extended Appendix: ${copy.speciesLabel} Trend Charts & Full Event Log`);

    const chart1Url = renderWellBeingTrendCanvas(checkIns);
    if (chart1Url) {
      const chart1H = (320 / 960) * contentWidth;
      ensureSpace(chart1H + 4);
      doc.addImage(chart1Url, 'PNG', margin, y, contentWidth, chart1H);
      y += chart1H + 5;
    }

    const chartRespUrl = renderRespiratoryCanvas(checkIns);
    if (chartRespUrl) {
      const chartRespH = (210 / 960) * contentWidth;
      ensureSpace(chartRespH + 4);
      doc.addImage(chartRespUrl, 'PNG', margin, y, contentWidth, chartRespH);
      y += chartRespH + 5;
    }

    drawExtendedHeader(`Chronological Structured Events (${events.length} Records)`);
    const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);
    if (sortedEvents.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text('No discrete clinical events recorded.', margin + 2, y);
      y += 6;
    } else {
      sortedEvents.slice(0, 40).forEach((ev) => {
        const dLabel = new Date(ev.timestamp).toISOString().split('T')[0];
        const line = cleanText(
          `${dLabel} -- ${ev.eventName} [${ev.category} | ${ev.severity}] by ${ev.loggedByUserName}${
            ev.notes ? `: "${ev.notes}"` : ''
          }`
        );
        const lines = doc.splitTextToSize(line, contentWidth - 4);
        ensureSpace(lines.length * 3.8 + 2);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(30, 41, 59);
        doc.text(lines, margin + 2, y);
        y += lines.length * 3.8 + 1.5;
      });
    }
  }

  // Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, pageHeight - 13, margin + contentWidth, pageHeight - 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      cleanText(
        `Senior Pet Care Monitor (${copy.speciesLabel} Pathway) -- Owner-reported observational brief for ${pet.name}. No diagnosis or treatment advice.`
      ),
      margin,
      pageHeight - 8.5
    );
    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 8.5, { align: 'right' });
  }

  return doc;
}

export async function generateAndDownloadVetPdf(data: CompleteVetReportData): Promise<string> {
  const doc = buildPreVisitBriefPdfDoc(data);
  const reportDate = new Date().toISOString().split('T')[0];
  const suffix = data.includeExtendedLog ? 'extended_vet_brief' : 'previsit_vet_brief_1page';
  const filename = `${data.pet.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${suffix}_${reportDate}.pdf`;
  doc.save(filename);
  return filename;
}
