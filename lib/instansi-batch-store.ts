import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type BatchItem = { name: string; student_code: string; invoice_id: number; invoice_number: string; total: number };
type Batch = { schoolName?: string; items: BatchItem[] };
type State = { batch: Batch | null; setBatch: (b: Batch) => void; clear: () => void };

export const useInstansiBatch = create<State>()(
    persist(
        (set) => ({ batch: null, setBatch: (batch) => set({ batch }), clear: () => set({ batch: null }) }),
        { name: "instansi-batch", storage: createJSONStorage(() => sessionStorage) }
    )
);