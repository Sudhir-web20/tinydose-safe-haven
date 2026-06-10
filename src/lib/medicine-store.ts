import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type { MedicineType } from "./medicines-db";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const medicineStorage = createJSONStorage<Pick<MedicineStore, "medicines">>(() =>
  typeof window === "undefined" ? noopStorage : window.localStorage,
);

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
  hydrated: boolean;
  add: (m: Omit<Medicine, "id" | "createdAt" | "finished">) => void;
  update: (id: string, patch: Partial<Medicine>) => void;
  remove: (id: string) => void;
  markFinished: (id: string) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useMedicineStore = create<MedicineStore>()(
  persist(
    (set) => ({
      medicines: [],
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
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
      name: "tinydose-vault-v1",
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
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Failed to rehydrate medicine store", error);
        }
        state?.setHydrated(true);
      },
    },
  ),
);

let hydrationPromise: Promise<void> | null = null;

export function ensureMedicineStoreHydrated() {
  if (typeof window === "undefined") return Promise.resolve();

  if (useMedicineStore.persist.hasHydrated()) {
    if (!useMedicineStore.getState().hydrated) {
      useMedicineStore.getState().setHydrated(true);
    }
    return Promise.resolve();
  }

  if (!hydrationPromise) {
    hydrationPromise = useMedicineStore.persist
      .rehydrate()
      .catch((error) => {
        console.error("Failed to rehydrate medicine store", error);
      })
      .finally(() => {
        useMedicineStore.getState().setHydrated(true);
      });
  }

  return hydrationPromise;
}

if (typeof window !== "undefined") {
  void ensureMedicineStoreHydrated();
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
