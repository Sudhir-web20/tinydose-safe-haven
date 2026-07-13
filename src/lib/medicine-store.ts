import { useEffect, useState } from "react";
import { create } from "zustand";
import type { MedicineType } from "./medicines-db";

export const MEDICINE_STORAGE_KEY = "tinydose-vault-v1";
export const MEDICINE_BACKUP_STORAGE_KEY = `${MEDICINE_STORAGE_KEY}:last-good`;
export const MEDICINE_STORAGE_REFRESH_EVENT = `${MEDICINE_STORAGE_KEY}:changed`;

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

function notifyMedicineStorageChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MEDICINE_STORAGE_REFRESH_EVENT));
}

function createPersistedMedicineValue(medicines: Medicine[]) {
  return JSON.stringify({ state: { medicines }, version: 1 });
}

function saveMedicineSnapshot(medicines: Medicine[]) {
  if (typeof window === "undefined") return;

  const value = createPersistedMedicineValue(medicines);
  window.localStorage.setItem(MEDICINE_STORAGE_KEY, value);
  window.localStorage.setItem(MEDICINE_BACKUP_STORAGE_KEY, value);
  notifyMedicineStorageChanged();
}

function pickBestPersistedSnapshot(primaryValue: string | null, backupValue: string | null) {
  const primaryMedicines = extractPersistedMedicines(primaryValue);
  const backupMedicines = extractPersistedMedicines(backupValue);

  if (backupValue && backupMedicines.length > primaryMedicines.length) {
    return { value: backupValue, medicines: backupMedicines, usedBackup: true };
  }

  return { value: primaryValue, medicines: primaryMedicines, usedBackup: false };
}

export const useMedicineStore = create<MedicineStore>()((set, get) => ({
  medicines: [],
  add: (m) => {
    const medicines = [
      ...get().medicines,
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
    const medicines = get().medicines.map((x) => (x.id === id ? { ...x, ...patch } : x));
    set({ medicines });
    saveMedicineSnapshot(medicines);
  },
  remove: (id) => {
    const medicines = get().medicines.filter((x) => x.id !== id);
    set({ medicines });
    saveMedicineSnapshot(medicines);
  },
  markFinished: (id) => {
    const medicines = get().medicines.map((x) =>
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
  if (typeof window === "undefined") return false;
  return extractPersistedMedicines(window.localStorage.getItem(MEDICINE_BACKUP_STORAGE_KEY)).length > 0;
}

export function readMedicineStorageSnapshot() {
  if (typeof window === "undefined") return [];
  const primaryValue = window.localStorage.getItem(MEDICINE_STORAGE_KEY);
  const backupValue = window.localStorage.getItem(MEDICINE_BACKUP_STORAGE_KEY);
  return pickBestPersistedSnapshot(primaryValue, backupValue).medicines;
}

export function readMedicineBackupSnapshot() {
  if (typeof window === "undefined") return [];
  return extractPersistedMedicines(window.localStorage.getItem(MEDICINE_BACKUP_STORAGE_KEY));
}

export function refreshMedicineStoreFromStorage() {
  if (typeof window === "undefined") return false;

  const primaryValue = window.localStorage.getItem(MEDICINE_STORAGE_KEY);
  const backupValue = window.localStorage.getItem(MEDICINE_BACKUP_STORAGE_KEY);
  const hasStoredSnapshot = primaryValue !== null || backupValue !== null;

  if (!hasStoredSnapshot) {
    return false;
  }

  const best = pickBestPersistedSnapshot(primaryValue, backupValue);

  if (best.usedBackup && best.value) {
    window.localStorage.setItem(MEDICINE_STORAGE_KEY, best.value);
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
  if (typeof window === "undefined") return false;

  const backupValue = window.localStorage.getItem(MEDICINE_BACKUP_STORAGE_KEY);
  const medicines = extractPersistedMedicines(backupValue);

  if (medicines.length === 0 || !backupValue) {
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
