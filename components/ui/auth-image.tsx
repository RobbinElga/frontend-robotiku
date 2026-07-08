"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function AuthImage({ path, alt, className }: { path: string | null; alt?: string; className?: string }) {
    const [url, setUrl] = useState<string | null>(null);
    useEffect(() => {
        if (!path) { setUrl(null); return; }
        let obj: string | null = null; let active = true;
        api.get(`/media/${path}`, { responseType: "blob" })
            .then((r) => { if (active) { obj = URL.createObjectURL(r.data as Blob); setUrl(obj); } })
            .catch(() => { });
        return () => { active = false; if (obj) URL.revokeObjectURL(obj); };
    }, [path]);

    if (!url) return <div className={`${className ?? ""} animate-pulse bg-muted`} />;
    return <img src={url} alt={alt} className={className} />;
}