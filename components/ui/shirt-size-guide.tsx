"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ruler, X } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";

export function ShirtSizeGuide({ className = "" }: { className?: string }) {
    const [open, setOpen] = useState(false);
    const { data } = useQuery({
        queryKey: ["ukuran-kaos"],
        queryFn: async () => (await api.get<ApiEnvelope<{ url: string | null }>>("/ukuran-kaos")).data.data,
        staleTime: 1000 * 60 * 10,
    });

    if (!data?.url) return null; // belum ada panduan → jangan tampilkan tombol

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={`inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-yellow-300 px-3 py-1.5 text-sm font-bold shadow-[2px_2px_0_#000] transition-transform hover:-translate-y-0.5 ${className}`}
            >
                <Ruler className="h-4 w-4" /> Lihat panduan ukuran
            </button>

            {open && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
                    <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border-2 border-black bg-white p-4 shadow-[6px_6px_0_#000]" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-lg font-extrabold">Panduan Ukuran Kaos</h3>
                            <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
                        </div>
                        <img src={data.url} alt="Panduan ukuran kaos" className="w-full rounded-lg border" />
                    </div>
                </div>
            )}
        </>
    );
}