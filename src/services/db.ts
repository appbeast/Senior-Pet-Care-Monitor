import {
  PetRecord,
  DailyCheckIn,
  PetEvent,
  MedicationSchedule,
  DoseLog,
  CareCircleMember,
  CognitiveAssessmentLog,
  QoLAssessmentLog,
  CorrelationEvent,
  VetBriefRecord,
} from '../types';
import {
  STARTER_PET,
  STARTER_CAT_PET,
  STARTER_CARE_CIRCLE,
  STARTER_CAT_CARE_CIRCLE,
  STARTER_MEDICATIONS,
  STARTER_CAT_MEDICATIONS,
  generateStarterHistory,
  generateStarterCatHistory,
} from '../data/starterData';

const DB_NAME = 'senior_pet_monitor_db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('pets')) {
        db.createObjectStore('pets', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('checkins')) {
        const store = db.createObjectStore('checkins', { keyPath: 'id' });
        store.createIndex('petId', 'petId', { unique: false });
        store.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains('events')) {
        const store = db.createObjectStore('events', { keyPath: 'id' });
        store.createIndex('petId', 'petId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains('medications')) {
        const store = db.createObjectStore('medications', { keyPath: 'id' });
        store.createIndex('petId', 'petId', { unique: false });
      }
      if (!db.objectStoreNames.contains('doses')) {
        const store = db.createObjectStore('doses', { keyPath: 'id' });
        store.createIndex('petId', 'petId', { unique: false });
        store.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains('carecircle')) {
        const store = db.createObjectStore('carecircle', { keyPath: 'id' });
        store.createIndex('petId', 'petId', { unique: false });
      }
      if (!db.objectStoreNames.contains('cognitive_logs')) {
        const store = db.createObjectStore('cognitive_logs', { keyPath: 'id' });
        store.createIndex('petId', 'petId', { unique: false });
      }
      if (!db.objectStoreNames.contains('qol_logs')) {
        const store = db.createObjectStore('qol_logs', { keyPath: 'id' });
        store.createIndex('petId', 'petId', { unique: false });
      }
      if (!db.objectStoreNames.contains('correlation_events')) {
        const store = db.createObjectStore('correlation_events', { keyPath: 'id' });
        store.createIndex('pet_id', 'pet_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('vet_briefs')) {
        const store = db.createObjectStore('vet_briefs', { keyPath: 'id' });
        store.createIndex('pet_id', 'pet_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = async () => {
      const db = request.result;
      await seedStarterDataIfEmpty(db);
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

async function seedStarterDataIfEmpty(db: IDBDatabase): Promise<void> {
  return new Promise((resolve) => {
    const tx = db.transaction(['pets'], 'readonly');
    const store = tx.objectStore('pets');
    const countReq = store.count();

    countReq.onsuccess = async () => {
      if (countReq.result === 0) {
        const writeTx = db.transaction(
          ['pets', 'carecircle', 'medications', 'checkins', 'doses', 'events', 'cognitive_logs', 'qol_logs', 'settings'],
          'readwrite'
        );

        // Seed Dog Starter (Barnaby)
        writeTx.objectStore('pets').put(STARTER_PET);
        STARTER_CARE_CIRCLE.forEach((m) => writeTx.objectStore('carecircle').put(m));
        STARTER_MEDICATIONS.forEach((med) => writeTx.objectStore('medications').put(med));
        const dogHistory = generateStarterHistory();
        dogHistory.checkIns.forEach((ci) => writeTx.objectStore('checkins').put(ci));
        dogHistory.doses.forEach((d) => writeTx.objectStore('doses').put(d));
        dogHistory.events.forEach((ev) => writeTx.objectStore('events').put(ev));
        dogHistory.cognitiveLogs.forEach((cl) => writeTx.objectStore('cognitive_logs').put(cl));
        dogHistory.qolLogs.forEach((ql) => writeTx.objectStore('qol_logs').put(ql));

        // Seed Cat Starter (Miso)
        writeTx.objectStore('pets').put(STARTER_CAT_PET);
        STARTER_CAT_CARE_CIRCLE.forEach((m) => writeTx.objectStore('carecircle').put(m));
        STARTER_CAT_MEDICATIONS.forEach((med) => writeTx.objectStore('medications').put(med));
        const catHistory = generateStarterCatHistory();
        catHistory.checkIns.forEach((ci) => writeTx.objectStore('checkins').put(ci));
        catHistory.doses.forEach((d) => writeTx.objectStore('doses').put(d));
        catHistory.events.forEach((ev) => writeTx.objectStore('events').put(ev));
        catHistory.cognitiveLogs.forEach((cl) => writeTx.objectStore('cognitive_logs').put(cl));
        catHistory.qolLogs.forEach((ql) => writeTx.objectStore('qol_logs').put(ql));

        writeTx.objectStore('settings').put({ key: 'activePetId', value: STARTER_PET.id });
        writeTx.objectStore('settings').put({ key: 'currentUserRole', value: 'owner' });
        writeTx.objectStore('settings').put({ key: 'appTier', value: 'paid' });

        writeTx.oncomplete = () => resolve();
        writeTx.onerror = () => resolve();
      } else {
        // Ensure Miso starter cat exists when upgrading from v1 DB
        const checkMisoReq = store.get(STARTER_CAT_PET.id);
        checkMisoReq.onsuccess = () => {
          if (!checkMisoReq.result) {
            const writeTx = db.transaction(
              ['pets', 'carecircle', 'medications', 'checkins', 'doses', 'events', 'cognitive_logs', 'qol_logs'],
              'readwrite'
            );
            writeTx.objectStore('pets').put(STARTER_CAT_PET);
            STARTER_CAT_CARE_CIRCLE.forEach((m) => writeTx.objectStore('carecircle').put(m));
            STARTER_CAT_MEDICATIONS.forEach((med) => writeTx.objectStore('medications').put(med));
            const catHistory = generateStarterCatHistory();
            catHistory.checkIns.forEach((ci) => writeTx.objectStore('checkins').put(ci));
            catHistory.doses.forEach((d) => writeTx.objectStore('doses').put(d));
            catHistory.events.forEach((ev) => writeTx.objectStore('events').put(ev));
            catHistory.cognitiveLogs.forEach((cl) => writeTx.objectStore('cognitive_logs').put(cl));
            catHistory.qolLogs.forEach((ql) => writeTx.objectStore('qol_logs').put(ql));
            writeTx.oncomplete = () => resolve();
            writeTx.onerror = () => resolve();
          } else {
            resolve();
          }
        };
        checkMisoReq.onerror = () => resolve();
      }
    };

    countReq.onerror = () => resolve();
  });
}

async function getAllFromStore<T>(storeName: string, indexName?: string, query?: IDBValidKey | IDBKeyRange): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const target = indexName ? store.index(indexName) : store;
    const req = query ? target.getAll(query) : target.getAll();

    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

async function putToStore<T>(storeName: string, item: T): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function normalizePetRecord(raw: PetRecord): PetRecord {
  const pathway = raw.species_pathway || (raw.species === 'feline' ? 'cat' : 'dog');
  return {
    ...raw,
    species_pathway: pathway,
    age_estimated: raw.age_estimated ?? false,
  };
}

function normalizeCognitiveLog(raw: CognitiveAssessmentLog, fallbackPathway: 'dog' | 'cat'): CognitiveAssessmentLog {
  if (raw.per_dimension_scores && raw.instrument) {
    return raw;
  }
  const instrument = raw.instrument || (fallbackPathway === 'cat' ? 'VISHDAAL' : 'DISHAA');
  return {
    ...raw,
    instrument,
    completed_at: raw.completed_at || new Date(raw.timestamp || Date.now()).toISOString(),
    triggered_by: raw.triggered_by || 'manual',
    next_due_at: raw.next_due_at || new Date((raw.timestamp || Date.now()) + 183 * 86400000).toISOString(),
    per_dimension_scores: raw.per_dimension_scores || {},
    not_sure_flags: raw.not_sure_flags || {},
    answeredDimensionCount: raw.answeredDimensionCount ?? 7,
    frequencySummary: raw.frequencySummary || 'Previous cognitive screening recorded.',
  };
}

export const localDb = {
  async getPets(): Promise<PetRecord[]> {
    const pets = await getAllFromStore<PetRecord>('pets');
    return pets.map(normalizePetRecord);
  },
  async getPet(id: string): Promise<PetRecord | undefined> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pets', 'readonly');
      const req = tx.objectStore('pets').get(id);
      req.onsuccess = () => resolve(req.result ? normalizePetRecord(req.result as PetRecord) : undefined);
      req.onerror = () => reject(req.error);
    });
  },
  async savePet(pet: PetRecord): Promise<void> {
    return putToStore('pets', normalizePetRecord(pet));
  },

  async getCheckIns(petId: string): Promise<DailyCheckIn[]> {
    const all = await getAllFromStore<DailyCheckIn>('checkins', 'petId', petId);
    return all.sort((a, b) => b.timestamp - a.timestamp);
  },
  async saveCheckIn(checkIn: DailyCheckIn): Promise<void> {
    return putToStore('checkins', checkIn);
  },

  async getEvents(petId: string): Promise<PetEvent[]> {
    const all = await getAllFromStore<PetEvent>('events', 'petId', petId);
    return all.sort((a, b) => b.timestamp - a.timestamp);
  },
  async saveEvent(event: PetEvent): Promise<void> {
    return putToStore('events', event);
  },

  async getMedications(petId: string): Promise<MedicationSchedule[]> {
    return getAllFromStore<MedicationSchedule>('medications', 'petId', petId);
  },
  async saveMedication(med: MedicationSchedule): Promise<void> {
    return putToStore('medications', med);
  },

  async getDoses(petId: string): Promise<DoseLog[]> {
    const all = await getAllFromStore<DoseLog>('doses', 'petId', petId);
    return all.sort((a, b) => b.timestamp - a.timestamp);
  },
  async saveDose(dose: DoseLog): Promise<void> {
    return putToStore('doses', dose);
  },

  async getCareCircle(petId: string): Promise<CareCircleMember[]> {
    return getAllFromStore<CareCircleMember>('carecircle', 'petId', petId);
  },
  async saveCareCircleMember(member: CareCircleMember): Promise<void> {
    return putToStore('carecircle', member);
  },

  async getCognitiveLogs(petId: string, pathway: 'dog' | 'cat' = 'dog'): Promise<CognitiveAssessmentLog[]> {
    const all = await getAllFromStore<CognitiveAssessmentLog>('cognitive_logs', 'petId', petId);
    return all.map((l) => normalizeCognitiveLog(l, pathway)).sort((a, b) => b.timestamp - a.timestamp);
  },
  async saveCognitiveLog(log: CognitiveAssessmentLog): Promise<void> {
    return putToStore('cognitive_logs', log);
  },

  async getQoLLogs(petId: string): Promise<QoLAssessmentLog[]> {
    const all = await getAllFromStore<QoLAssessmentLog>('qol_logs', 'petId', petId);
    return all.sort((a, b) => b.timestamp - a.timestamp);
  },
  async saveQoLLog(log: QoLAssessmentLog): Promise<void> {
    return putToStore('qol_logs', log);
  },

  // Correlation Events (Enhancement 3)
  async getCorrelationEvents(petId: string): Promise<CorrelationEvent[]> {
    return getAllFromStore<CorrelationEvent>('correlation_events', 'pet_id', petId);
  },
  async saveCorrelationEvent(ev: CorrelationEvent): Promise<void> {
    return putToStore('correlation_events', ev);
  },

  // Pre-Visit Vet Briefs (Enhancement 4)
  async getVetBriefs(petId: string): Promise<VetBriefRecord[]> {
    const all = await getAllFromStore<VetBriefRecord>('vet_briefs', 'pet_id', petId);
    return all.sort((a, b) => b.generated_at.localeCompare(a.generated_at));
  },
  async saveVetBrief(brief: VetBriefRecord): Promise<void> {
    return putToStore('vet_briefs', brief);
  },

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const req = tx.objectStore('settings').get(key);
      req.onsuccess = () => {
        resolve(req.result ? req.result.value : defaultValue);
      };
      req.onerror = () => resolve(defaultValue);
    });
  },
  async saveSetting<T>(key: string, value: T): Promise<void> {
    return putToStore('settings', { key, value });
  },

  async exportFullArchive(petId: string) {
    const pet = await this.getPet(petId);
    const pathway = pet?.species_pathway || 'dog';
    const [checkIns, events, medications, doses, cognitiveLogs, qolLogs, careCircle, correlationEvents, vetBriefs] =
      await Promise.all([
        this.getCheckIns(petId),
        this.getEvents(petId),
        this.getMedications(petId),
        this.getDoses(petId),
        this.getCognitiveLogs(petId, pathway),
        this.getQoLLogs(petId),
        this.getCareCircle(petId),
        this.getCorrelationEvents(petId),
        this.getVetBriefs(petId),
      ]);

    return {
      pet,
      checkIns,
      events,
      medications,
      doses,
      cognitiveLogs,
      qolLogs,
      careCircle,
      correlationEvents,
      vetBriefs,
      exportedAt: new Date().toISOString(),
    };
  },
};
