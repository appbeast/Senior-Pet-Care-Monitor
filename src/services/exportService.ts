import { PetRecord, DailyCheckIn, PetEvent, MedicationSchedule, DoseLog, MetricBaseline, ExpiringShareLink } from '../types';

export function calculateMedicationAdherence(doses: DoseLog[], pastDays: number = 30): number {
  const cutoff = Date.now() - pastDays * 86400000;
  const relevantDoses = doses.filter((d) => d.timestamp >= cutoff);
  if (relevantDoses.length === 0) return 100;

  const givenCount = relevantDoses.filter((d) => d.status === 'given').length;
  return Math.round((givenCount / relevantDoses.length) * 100);
}

export function generateExpiringShareLink(petId: string): ExpiringShareLink {
  const now = Date.now();
  const token = 'vet_' + Math.random().toString(36).substring(2, 10) + '_' + Math.random().toString(36).substring(2, 6);
  const expiresAt = now + 7 * 86400000; // 7 days from now
  const baseUrl = window.location.origin;
  const url = `${baseUrl}/?share_token=${token}&pet=${petId}`;

  return {
    token,
    petId,
    createdAt: now,
    expiresAt,
    url,
  };
}

export function downloadRawCsv(
  pet: PetRecord,
  checkIns: DailyCheckIn[],
  events: PetEvent[],
  doses: DoseLog[]
): void {
  let csvContent = 'data:text/csv;charset=utf-8,';

  // Section 1: Daily Check-Ins
  csvContent += '--- DAILY CHECK-INS ---\n';
  csvContent += 'Date,Appetite (1-5),Water (1-5),Energy (1-5),Mobility (1-5),Comfort (1-5),Stool (1-7),Sleeping Breathing Rate (br/min),Good Day Flag,Logged By,Notes\n';
  checkIns.forEach((c) => {
    const row = [
      c.date,
      c.appetite,
      c.waterIntake,
      c.energyActivity,
      c.mobilityStiffness,
      c.comfortPain,
      c.stoolQuality,
      c.restingBreathingRate || '',
      c.isGoodDay ? 'Good' : 'Hard',
      `"${c.loggedByUserName} (${c.userRole})"`,
      `"${(c.quickNote || '').replace(/"/g, '""')}"`,
    ];
    csvContent += row.join(',') + '\n';
  });

  // Section 2: Discrete Senior Events
  csvContent += '\n--- STRUCTURED EVENTS ---\n';
  csvContent += 'Timestamp,Date,Category,Event Name,Severity,Logged By,Notes,Has Voice Note,Has Photo\n';
  events.forEach((e) => {
    const dStr = new Date(e.timestamp).toISOString();
    const row = [
      e.timestamp,
      dStr,
      e.category,
      `"${e.eventName}"`,
      e.severity,
      `"${e.loggedByUserName} (${e.userRole})"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
      e.voiceNoteAudioUrl ? 'Yes' : 'No',
      e.photoDataUrl ? 'Yes' : 'No',
    ];
    csvContent += row.join(',') + '\n';
  });

  // Section 3: Medication Doses
  csvContent += '\n--- MEDICATION ADHERENCE LOG ---\n';
  csvContent += 'Date,Scheduled Time,Medication,Status,Administered By,Skip Reason,Notes\n';
  doses.forEach((d) => {
    const row = [
      d.date,
      d.scheduledTime,
      `"${d.medicationName}"`,
      d.status,
      `"${d.administeredByName} (${d.administeredByRole})"`,
      `"${(d.skipReason || '').replace(/"/g, '""')}"`,
      `"${(d.notes || '').replace(/"/g, '""')}"`,
    ];
    csvContent += row.join(',') + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${pet.name.toLowerCase()}_senior_care_history_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printSinglePageVetReport(): void {
  window.print();
}
