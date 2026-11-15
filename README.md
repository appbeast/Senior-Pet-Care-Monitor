# Senior Pet Care Monitor (PWA)

> "The senior pet monitor that tells you what changed, what to ask your vet, and what to do next — without requiring a collar, a subscription, or a data-science degree."

## 1. Product Overview & Architecture
This progressive web application is an offline-first mobile and desktop application purpose-built for owners and caregivers of geriatric dogs and cats. Rather than displaying raw metrics or sensor counts, it focuses entirely on **baseline-relative deviation**, **early clinical trend detection**, and **veterinary consultation preparation**.

### Core Technical Pillars:
*   **Offline-First IndexedDB Persistence**: Every write (check-in, structured observation, medication dose, voice note, photo) succeeds locally immediately and queues for idempotent sync.
*   **Deterministic Baseline Calculation**: Rolling 7-day and 30-day means with strict sample count guards (never displays a deviation against fewer than 5 data points).
*   **Flagship Weekly Change Brief**: Synthesizes 3 factual change bullets, 1 specific question to ask the veterinarian, and 1 metric to watch next week.
*   **Duplicate-Dose Safety Shield**: Immediate warning dialog if another caregiver logged the same medication within 90 minutes.
*   **Single-Page Vet-Ready Export**: Client-side printable PDF summary, 7-day expiring shareable link, and raw CSV data download.
*   **Validated Screening Protocols**: 4-week Canine Cognitive Dysfunction Rating (CCDR/DISHA) and weekly Quality of Life (adapted HHHHHMM) reviews.

---

## 2. Core Data Model & Sync Strategy

```
┌────────────────────────────────────────────────────────┐
│                   PET RECORD STORE                     │
│ id, name, species, breed, age, weightHistory, goals    │
└──────────────────────────┬─────────────────────────────┘
                           │
      ┌────────────────────┼─────────────────────┐
      ▼                    ▼                     ▼
┌──────────────┐   ┌──────────────┐       ┌──────────────┐
│  CHECK-INS   │   │  PET EVENTS  │       │ MEDICATIONS  │
│ 5 thumb      │   │ 75+ Taxonomy │       │ Schedules,   │
│ sliders,     │   │ Severity,    │       │ Doses,       │
│ Good/Bad day │   │ Audio, Photo │       │ Attributions │
└──────────────┘   └──────────────┘       └──────────────┘
```

*   **Idempotent UUIDs**: Client generates unique UUIDs (`checkin_<petId>_<date>_<timestamp>`, `dose_<timestamp>_<rand>`) preventing collisions across multi-caregiver environments.
*   **Conflict Resolution**: Last-write-wins per scalar field with an append-only event log so no clinical observation is ever silently overwritten or dropped.
*   **Multimedia Durability**: 10-second voice memos and camera photos are encoded and stored directly in IndexedDB binary object stores, avoiding browser localStorage quotas.

---

## 3. Seed Event Taxonomy (75+ Types Across 9 Categories)
Located in `src/data/eventTaxonomy.ts`:
1.  **Cognitive & Behavior (9 types)**: Disorientation, stuck behind doors, sleep-wake reversal, night pacing, house soiling, altered greeting, unprovoked vocalization, social withdrawal, clinginess/shadowing.
2.  **Mobility & Joints (10 types)**: Stiffness on rising, stairs hesitation, floor slipping, limb tremors, knuckling/scuffing nails, exercise reluctance, post-exercise lameness, trouble settling, balance loss, head tilt.
3.  **Appetite & Water (9 types)**: Reduced intake, food refusal, increased drinking, dropping kibble, one-sided chewing, nausea drool, breath odor, food bowl irritability, muscle wasting.
4.  **Stomach & Digestion (9 types)**: Vomiting food, vomiting yellow bile/foam, effortless regurgitation, loose stool, watery diarrhea, blood in stool, constipation, loud gurgling, tense abdomen.
5.  **Bladder & Elimination (7 types)**: Sleep incontinence, frequent urination, straining, blood in urine, indoor accident, unstable elimination posture, genital licking.
6.  **Comfort & Breathing (9 types)**: Vocalization on touch, restlessness, resting panting, area guarding, hunched spine, shivering at rest, elevated sleeping respiratory rate (>30 br/min), coughing spells, labored breathing.
7.  **Sensory, Eyes & Skin (8 types)**: Bumping in dim light, hearing loss indicators, eye discharge, head shaking, obsessive paw chewing, new skin lumps, dull coat, seizure episodes.
8.  **Care & Treatments (7 types)**: Medication given, dose skipped/refused, sub-Q fluids given, vet visit, home weigh-in, diet transition, nail trim.
9.  **Daily Well-being Ratings (6 scales)**: Appetite, Hydration, Energy, Mobility, Comfort, Good Day vs Hard Day flag.

---

## 4. Places Flagged for Veterinary Review Prior to Production Release
The following owner-facing strings and clinical thresholds must be formally audited and approved by a licensed veterinarian:
1.  **Sleeping Respiratory Rate threshold**: `> 30 breaths/min`. Warning text: *"Breathing rate while resting or asleep is higher than 30 breaths per minute. Please recount for 60 seconds; if it remains elevated or breathing looks labored, contact your veterinarian promptly."*
2.  **Subcutaneous Fluids site rotation guidance**: *"Alternate left dorsal flank, right dorsal flank, and scruff to prevent tissue edema."*
3.  **Medication Missed guidance**: *"Dose was skipped or vomited. Contact your clinic before administering a replacement dose."*
4.  **Canine Cognitive Dysfunction (DISHA) scoring thresholds**: Minimal (0–19), Mild (20–39), Moderate (40–59), Severe (60–100).
5.  **Quality of Life non-directive framing**: Assurance that QoL scoring is reflection support and never generates an automated euthanasia recommendation.
