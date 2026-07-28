// lib/use-parent-guard.ts
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParent } from "@/lib/parent-store";

export function useParentGuard() {
    const parent = useParent((s) => s.parent);
    const router = useRouter();
    const [ready, setReady] = useState(false);

    // tandai sudah di client (setelah zustand persist hidrasi)
    useEffect(() => setReady(true), []);

    useEffect(() => {
        if (ready && !parent) router.replace("/bayar"); // ganti ke halaman lookup/masuk ortu-mu
    }, [ready, parent, router]);

    return { parent, ready };
}