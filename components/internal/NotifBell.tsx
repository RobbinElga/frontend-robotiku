"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { cn } from "@/lib/utils";

type Notif = { id: number; title: string; message: string; is_read: boolean; created_at: string };

export function NotifBell() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const qc = useQueryClient();

    const { data } = useQuery({
        queryKey: ["notif"],
        queryFn: async () => (await api.get<ApiEnvelope<{ data: Notif[] }>>("/notifikasi")).data.data.data,
        refetchInterval: 30000,
    });
    const items = data ?? [];
    const unread = items.filter((n) => !n.is_read).length;

    useEffect(() => {
        const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const markRead = async (id: number) => {
        try { await api.patch(`/notifikasi/${id}/read`); qc.invalidateQueries({ queryKey: ["notif"] }); } catch { /* abaikan */ }
    };

    return (
        <div ref={ref} className="relative">
            <button onClick={() => setOpen((o) => !o)} className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-lg border bg-background shadow-lg">
                    <div className="border-b px-4 py-2.5 text-sm font-semibold">Notifikasi</div>
                    <div className="max-h-80 divide-y overflow-y-auto">
                        {items.length ? items.map((n) => (
                            <button key={n.id} onClick={() => markRead(n.id)} className={cn("block w-full px-4 py-3 text-left hover:bg-muted", !n.is_read && "bg-primary/5")}>
                                <div className="flex items-start gap-2">
                                    {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium">{n.title}</div>
                                        <div className="truncate text-xs text-muted-foreground">{n.message}</div>
                                    </div>
                                </div>
                            </button>
                        )) : <p className="px-4 py-8 text-center text-sm text-muted-foreground">Tidak ada notifikasi.</p>}
                    </div>
                </div>
            )}
        </div>
    );
}