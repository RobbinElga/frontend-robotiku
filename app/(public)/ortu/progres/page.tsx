"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, UserX, CalendarOff, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type ApiEnvelope } from "@/lib/api";
import { useParent } from "@/lib/parent-store";
import { ParentShell } from "@/components/ortu/ParentShell";
import { cn } from "@/lib/utils";

type Att = { id: number; status: "hadir" | "izin" | "tidak_hadir"; report: string | null; attended_at: string };
type Progress = { summary: { hadir: number; izin: number; tidak_hadir: number; total_sesi: number }; attendances: Att[] };

const sb: Record<string, { label: string; cls: string }> = {
    hadir: { label: "Hadir", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    izin: { label: "Izin", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    tidak_hadir: { label: "Tidak hadir", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

function ProgresInner() {
    const parent = useParent((s) => s.parent)!;
    const q = useQuery({
        queryKey: ["ortu-progres", parent.studentId],
        queryFn: async () => (await api.post<ApiEnvelope<Progress>>("/murid/progress", { student_id: parent.studentId, phone: parent.phone })).data.data,
    });

    const cards = [
        { label: "Hadir", value: q.data?.summary.hadir, icon: CalendarCheck },
        { label: "Izin", value: q.data?.summary.izin, icon: UserX },
        { label: "Tidak Hadir", value: q.data?.summary.tidak_hadir, icon: CalendarOff },
        { label: "Total Sesi", value: q.data?.summary.total_sesi, icon: ListChecks },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Progres & Kehadiran</h1>
                <p className="text-sm text-muted-foreground">Ringkasan kehadiran dan catatan sesi {parent.name}.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map(({ label, value, icon: Icon }) => (
                    <Card key={label}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                            <Icon className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>{q.isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-semibold">{value ?? 0}</div>}</CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader><CardTitle className="text-base">Riwayat Sesi</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {q.isLoading && <Skeleton className="h-16 w-full" />}
                    {q.data?.attendances.map((a) => {
                        const s = sb[a.status];
                        return (
                            <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg border p-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">{a.attended_at?.slice(0, 10)}</p>
                                    <p className="mt-1 text-sm">{a.report || <span className="text-muted-foreground">Tidak ada catatan.</span>}</p>
                                </div>
                                <Badge variant="outline" className={cn(s.cls)}>{s.label}</Badge>
                            </div>
                        );
                    })}
                    {q.data && q.data.attendances.length === 0 && <p className="text-center text-sm text-muted-foreground">Belum ada sesi.</p>}
                </CardContent>
            </Card>
        </div>
    );
}

export default function Page() {
    return <ParentShell><ProgresInner /></ParentShell>;
}