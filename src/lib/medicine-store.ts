import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
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

interface PersistedMedicineState {
  medicines: Medicine[];
}

function extractPersistedMedicines(value: string | null | undefined): Medicine[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as { state?: unknown };
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

function pickBestPersistedSnapshot(primaryValue: string | null, backupValue: string | null) {
  const primaryMedicines = extractPersistedMedicines(primaryValue);
  const backupMedicines = extractPersistedMedicines(backupValue);

  if (backupValue && backupMedicines.length > primaryMedicines.length) {
    return { value: backupValue, medicines: backupMedicines, usedBackup: true };
  }

  return { value: primaryValue, medicines: primaryMedicines, usedBackup: false };
}

const browserMedicineStorage: StateStorage = {
  getItem: (name) => {
    const value = window.localStorage.getItem(name);

    if (name !== MEDICINE_STORAGE_KEY) {
      return value;
    }

    const backupValue = window.localStorage.getItem(MEDICINE_BACKUP_STORAGE_KEY);
    const best = pickBestPersistedSnapshot(value, backupValue);

    if (best.usedBackup && best.value) {
      window.localStorage.setItem(MEDICINE_STORAGE_KEY, best.value);
      return best.value;
    }

    return value;
  },
  setItem: (name, value) => {
    window.localStorage.setItem(name, value);
    // Always mirror the latest persisted state into the backup snapshot so
    // startup verification has an up-to-date last-good state after every
    // add / edit / delete.
    window.localStorage.setItem(MEDICINE_BACKUP_STORAGE_KEY, value);
    notifyMedicineStorageChanged();
  },
  removeItem: (name) => {
    window.localStorage.removeItem(name);
    notifyMedicineStorageChanged();
  },
};

const noopMedicineStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const medicineStorage = createJSONStorage<PersistedMedicineState>(() =>
  typeof window !== "undefined" ? browserMedicineStorage : noopMedicineStorage,
);

export const useMedicineStore = create<MedicineStore>()(
  persist(
    (set) => ({
      medicines: [],
      add: (m) =>
        set((s) => ({
          medicines: [
            ...s.medicines,
            {
              ...m,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              finished: false,
            },
          ],
        })),
      update: (id, patch) =>
        set((s) => ({
          medicines: s.medicines.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      remove: (id) =>
        set((s) => ({ medicines: s.medicines.filter((x) => x.id !== id) })),
      markFinished: (id) =>
        set((s) => ({
          medicines: s.medicines.map((x) =>
            x.id === id ? { ...x, finished: true } : x,
          ),
        })),
    }),
    {
      name: MEDICINE_STORAGE_KEY,
      storage: medicineStorage,
      skipHydration: true,
      partialize: (state) => ({ medicines: state.medicines }),
      version: 1,
      migrate: (persistedState) => {
        if (
          persistedState &&
          typeof persistedState === "object" &&
          "medicines" in persistedState &&
          Array.isArray((persistedState as { medicines?: unknown }).medicines)
        ) {
          return {
            medicines: (persistedState as { medicines: Medicine[] }).medicines,
          };
        }

        return { medicines: [] };
      },
      merge: (persistedState, currentState) => ({
        ...currentState,
        medicines:
          persistedState &&
          typeof persistedState === "object" &&
          "medicines" in persistedState &&
          Array.isArray((persistedState as { medicines?: unknown }).medicines)
            ? (persistedState as PersistedMedicineState).medicines
            : currentState.medicines,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error("Failed to rehydrate medicine store", error);
        }
      },
    },
  ),
);

export function useMedicineStoreHydrated() {
  const [hydrated, setHydated] = useState(() => {
    if (typeof window === "undefined") return false;

    const persistApi = useMedicineStore.persist;
    return persistApi?.hasHydrated() ?? true;
  });

  useEffect(() => {
    const persistApi = useMedicineStore.persist;

    if (!persistApi) {
      setHydated(true);
      return;
    }

    setHydated(persistApi.hasHydrated());

    const unsubHydrate = persistApi.onHydrate(() => setHydated(false));
    const unsubFinishHydration = persistApi.onFinishHydration(() => setHydated(true));

    const fallback = window.setTimeout(() => {
      refreshMedicineStoreFromStorage();
      setHydated(true);
    }, 1200);

    if (!persistApi.hasHydrated()) {
      Promise.resolve(persistApi.rehydrate()).finally(() => {
        window.clearTimeout(fallback);
        refreshMedicineStoreFromStorage();
        setHydated(true);
      });
    } else {
      window.clearTimeout(fallback);
      refreshMedicineStoreFromStorage();
      setHydated(true);
    }

    return () => {
      window.clearTimeout(fallback);
      unsubHydrate();
      unsubFinishHydration();
    };
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

  browserMedicineStorage.setItem(MEDICINE_STORAGE_KEY, backupValue);
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
