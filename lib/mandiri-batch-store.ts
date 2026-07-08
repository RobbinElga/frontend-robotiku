import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type BatchItem = { name: string; student_code: string; invoice_id: number; invoice_number: string; total: number };
type State = { batch: { items: BatchItem[] } | null; setBatch: (b: { items: BatchItem[] }) => void; clear: () => void };

export const useMandiriBatch = create<State>()(
    persist((set) => ({ batch: null, setBatch: (batch) => set({ batch }), clear: () => set({ batch: null }) }),
        { name: "mandiri-batch", storage: createJSONStorage(() => sessionStorage) })
);