"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileText, X } from "lucide-react";

export function FileDrop({
    accept, label, hint, onPick, value,
}: { accept?: string; label?: string; hint?: string; onPick: (f: File | null) => void; value?: File | null }) {
    const ref = useRef<HTMLInputElement>(null);
    const [drag, setDrag] = useState(false);

    return (
        <div>
            {label && <p className="mb-1.5 text-sm font-medium">{label}</p>}
            <div
                onClick={() => ref.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); onPick(e.dataTransfer.files?.[0] ?? null); }}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed p-4 transition ${drag ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/40"}`}
            >
                {value ? (
                    <>
                        <FileText className="h-5 w-5 shrink-0 text-primary" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{value.name}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); onPick(null); if (ref.current) ref.current.value = ""; }} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
                    </>
                ) : (
                    <>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"><UploadCloud className="h-5 w-5" /></span>
                        <div className="min-w-0">
                            <div className="text-sm font-medium">Klik atau seret berkas ke sini</div>
                            <div className="text-xs text-muted-foreground">{hint ?? "Maks 5MB"}</div>
                        </div>
                    </>
                )}
            </div>
            <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
        </div>
    );
}