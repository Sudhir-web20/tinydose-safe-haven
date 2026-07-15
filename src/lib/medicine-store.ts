import { useEffect, useState } from "react";
import { create } from "zustand";
import type { MedicineType } from "./medicines-db";

export const MEDICINE_STORAGE_KEY = "tinydose-vault-v1";
export const MEDICINE_BACKUP_STORAGE_KEY = `${MEDICINE_STORAGE_KEY}:last-good`;
export const MEDICINE_HISTORY_STORAGE_KEY = `${MEDICINE_STORAGE_KEY}:history`;
export const MEDICINE_STORAGE_REFRESH_EVENT = `${MEDICINE_STORAGE_KEY}:changed`;

export const medicineStorageInitScript = `(function(){try{var p='${MEDICINE_STORAGE_KEY}',b='${MEDICINE_BACKUP_STORAGE_KEY}',h='${MEDICINE_HISTORY_STORAGE_KEY}';function meds(v){if(!v)return[];try{var x=JSON.parse(v);if(Array.isArray(x))return x;if(x&&Array.isArray(x.medicines))return x.medicines;if(x&&x.state&&Array.isArray(x.state.medicines))return x.state.medicines;}catch(e){}return[]}var pv=localStorage.getItem(p),bv=localStorage.getItem(b),best=pv,bm=meds(pv);if(meds(bv).length>bm.length){best=bv;bm=meds(bv)}try{var arr=JSON.parse(localStorage.getItem(h)||'[]');if(Array.isArray(arr)){for(var i=0;i<arr.length;i++){var m=meds(arr[i]);if(m.length>bm.length){best=arr[i];bm=m}}}}catch(e){}if(best&&bm.length){localStorage.setItem(p,best);localStorage.setItem(b,best)}}catch(e){}})();`;

export type MedicineStatus = "safe" | "soon" | "critical" | "expired" | "finished";

export interface Reminders {
  d60: boolean;
  d30: boolean;
  d7: boolean;
  d0: boolean;
}

export interface Medicine {
  id: string;
  name: string;
  generic?: string;
  type: MedicineType;
  expiryMonth: number; // 1-12
  expiryYear: number;
  openedDate?: string; // ISO
  doctor?: string;
  notes?: string;
  reminders: Reminders;
  finished: boolean;
  createdAt: string;
  imageUrl?: string;
}

interface MedicineStore {
  medicines: Medicine[];
  add: (m: Omit<Medicine, "id" | "createdAt" | "finished">) => void;
  update: (id: string, patch: Partial<Medicine>) => void;
  remove: (id: string) => void;
  markFinished: (id: string) => void;
}

interface PersistedSnapshot {
  value: string | null;
  medicines: Medicine[];
  usedBackup: boolean;
}

function extractPersistedMedicines(value: string | null | undefined): Medicine[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as { state?: unknown; medicines?: unknown } | Medicine[];

    if (Array.isArray(parsed)) {
      return parsed as Medicine[];
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      "medicines" in parsed &&
      Array.isArray((parsed as { medicines?: unknown }).medicines)
    ) {
      return (parsed as { medicines: Medicine[] }).medicines;
    }

    const state = parsed?.state;

    if (
      state &&
      typeof state === "object" &&
      "medicines" in state &&
      Array.isArray((state as { medicines?: unknown }).medicines)
    ) {
      return (state as { medicines: Medicine[] }).medicines;
    }
  } catch (error) {
    console.error("Failed to parse persisted medicine data", error);
  }

  return [];
}

function uniqueMedicines(medicines: Medicine[]): Medicine[] {
  const seen = new Set<string>();
  const result: Medicine[] = [];

  for (const medicine of medicines) {
    if (!medicine?.id || seen.has(medicine.id)) continue;
    seen.add(medicine.id);
    result.push(medicine);
  }

  return result;
}

function getBrowserStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch (error) {
    console.error("Medicine storage is unavailable", error);
    return null;
  }
}

function notifyMedicineStorageChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MEDICINE_STORAGE_REFRESH_EVENT));
}

function createPersistedMedicineValue(medicines: Medicine[]) {
  return JSON.stringify({ state: { medicines: uniqueMedicines(medicines) }, savedAt: new Date().toISOString(), version: 1 });
}

function saveMedicineSnapshot(medicines: Medicine[]) {
  const storage = getBrowserStorage();
  if (!storage) return;

  const cleanMedicines = uniqueMedicines(medicines);
  const previousSnapshots = [
    storage.getItem(MEDICINE_STORAGE_KEY),
    storage.getItem(MEDICINE_BACKUP_STORAGE_KEY),
    ...readMedicineSafetyHistoryValues(),
  ].filter(Boolean) as string[];

  const value = createPersistedMedicineValue(cleanMedicines);

  try {
    storage.setItem(MEDICINE_STORAGE_KEY, value);
    storage.setItem(MEDICINE_BACKUP_STORAGE_KEY, value);
    writeMedicineSafetyHistory([value, ...previousSnapshots]);
  } catch (error) {
    console.error("Failed to save medicine snapshot", error);
  }

  notifyMedicineStorageChanged();
}

function pickBestPersistedSnapshot(primaryValue: string | null, backupValue: string | null): PersistedSnapshot {
  const primaryMedicines = extractPersistedMedicines(primaryValue);
  const backupMedicines = extractPersistedMedicines(backupValue);

  if (backupValue && backupMedicines.length > primaryMedicines.length) {
    return { value: backupValue, medicines: backupMedicines, usedBackup: true };
  }

  return { value: primaryValue, medicines: primaryMedicines, usedBackup: false };
}

function readMedicineSafetyHistoryValues() {
  const storage = getBrowserStorage();
  if (!storage) return [];

  try {
    const parsed = JSON.parse(storage.getItem(MEDICINE_HISTORY_STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeMedicineSafetyHistory(values: string[]) {
  const storage = getBrowserStorage();
  if (!storage) return;

  const deduped = new Map<string, string>();
  for (const value of values) {
    const medicines = extractPersistedMedicines(value);
    if (medicines.length === 0) continue;
    const signature = medicines.map((m) => m.id).sort().join("|");
    if (!deduped.has(signature)) deduped.set(signature, value);
    if (deduped.size >= 5) break;
  }

  storage.setItem(MEDICINE_HISTORY_STORAGE_KEY, JSON.stringify([...deduped.values()]));
}

function getPersistedSnapshot(): PersistedSnapshot {
  const storage = getBrowserStorage();
  if (!storage) return { value: null, medicines: [], usedBackup: false };

  return pickBestPersistedSnapshot(
    storage.getItem(MEDICINE_STORAGE_KEY),
    storage.getItem(MEDICINE_BACKUP_STORAGE_KEY),
  );
}

function getBestSafetySnapshot() {
  const active = getPersistedSnapshot();
  const history = readMedicineSafetyHistoryValues()
    .map((value) => ({ value, medicines: extractPersistedMedicines(value) }))
    .filter((snapshot) => snapshot.medicines.length > 0)
    .sort((a, b) => b.medicines.length - a.medicines.length);

  const historicalBest = history[0];
  if (historicalBest && historicalBest.medicines.length > active.medicines.length) {
    return { ...historicalBest, fromHistory: true };
  }

  return { value: active.value, medicines: active.medicines, fromHistory: false };
}

function getStartupSnapshot() {
  const active = getPersistedSnapshot();
  if (active.medicines.length > 0) {
    return { value: active.value, medicines: active.medicines, fromHistory: false };
  }

  return getBestSafetySnapshot();
}

function getCurrentOrPersistedMedicines(current: Medicine[]) {
  const persisted = getPersistedSnapshot().medicines;
  return persisted.length > current.length ? persisted : current;
}

const initialMedicines = typeof window === "undefined" ? [] : getPersistedSnapshot().medicines;

export const useMedicineStore = create<MedicineStore>()((set, get) => ({
  medicines: initialMedicines,
  add: (m) => {
    const baseMedicines = getCurrentOrPersistedMedicines(get().medicines);
    const medicines = [
      ...baseMedicines,
      {
        ...m,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        finished: false,
      },
    ];
    set({ medicines });
    saveMedicineSnapshot(medicines);
  },
  update: (id, patch) => {
    const baseMedicines = getCurrentOrPersistedMedicines(get().medicines);
    const medicines = baseMedicines.map((x) => (x.id === id ? { ...x, ...patch } : x));
    set({ medicines });
    saveMedicineSnapshot(medicines);
  },
  remove: (id) => {
    const baseMedicines = getCurrentOrPersistedMedicines(get().medicines);
    const medicines = baseMedicines.filter((x) => x.id !== id);
    set({ medicines });
    saveMedicineSnapshot(medicines);
  },
  markFinished: (id) => {
    const baseMedicines = getCurrentOrPersistedMedicines(get().medicines);
    const medicines = baseMedicines.map((x) =>
      x.id === id ? { ...x, finished: true } : x,
    );
    set({ medicines });
    saveMedicineSnapshot(medicines);
  },
}));

export function useMedicineStoreHydrated() {
  const [hydrated, setHydated] = useState(false);

  useEffect(() => {
    refreshMedicineStoreFromStorage();
    setHydated(true);
  }, []);

  return hydrated;
}

export function hasMedicineBackupSnapshot() {
  return readMedicineBackupSnapshot().length > 0;
}

export function readMedicineStorageSnapshot() {
  return getPersistedSnapshot().medicines;
}

export function readMedicineBackupSnapshot() {
  const storage = getBrowserStorage();
  if (!storage) return [];
  return extractPersistedMedicines(storage.getItem(MEDICINE_BACKUP_STORAGE_KEY));
}

export function readMedicineSafetySnapshot() {
  return getBestSafetySnapshot().medicines;
}

export function refreshMedicineStoreFromStorage() {
  const storage = getBrowserStorage();
  if (!storage) return false;

  const best = getStartupSnapshot();
  if (best.medicines.length === 0) {
    return false;
  }

  if (best.value) {
    storage.setItem(MEDICINE_STORAGE_KEY, best.value);
    storage.setItem(MEDICINE_BACKUP_STORAGE_KEY, best.value);
  }

  useMedicineStore.setState({ medicines: best.medicines });
  return true;
}

export function subscribeToMedicineStorageRefresh(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (
      event.key === MEDICINE_STORAGE_KEY ||
      event.key === MEDICINE_BACKUP_STORAGE_KEY ||
      event.key === null
    ) {
      callback();
    }
  };

  window.addEventListener(MEDICINE_STORAGE_REFRESH_EVENT, callback);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(MEDICINE_STORAGE_REFRESH_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function restoreMedicineBackupSnapshot() {
  const best = getBestSafetySnapshot();
  const medicines = best.medicines;

  if (medicines.length === 0) {
    return false;
  }

  saveMedicineSnapshot(medicines);
  useMedicineStore.setState({ medicines });
  return true;
}

export function expiryDate(m: Pick<Medicine, "expiryMonth" | "expiryYear">): Date {
  // End of expiry month
  return new Date(m.expiryYear, m.expiryMonth, 0, 23, 59, 59);
}

export function daysUntil(d: Date): number {
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function statusOf(m: Medicine): MedicineStatus {
  if (m.finished) return "finished";
  const days = daysUntil(expiryDate(m));
  if (days < 0) return "expired";
  if (days < 15) return "critical";
  if (days < 60) return "soon";
  return "safe";
}
