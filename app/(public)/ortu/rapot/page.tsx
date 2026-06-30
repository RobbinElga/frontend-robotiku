"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, Loader2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type ApiEnvelope } from "@/lib/api";
import { useParent } from "@/lib/parent-store";
import { ParentShell } from "@/components/ortu/ParentShell";

type Report = {
    id: number; semester: string; year: number;
    skill_building: string; skill_imagination: string; skill_creativity: string; skill_logic: string;
    behavior_punctual: string; behavior_stay: string; behavior_communication: string; behavior_responsibility: string;
    comments: string | null;
};

const skills = (r: Report) => ({ "Building": r.skill_building, "Imagination": r.skill_imagination, "Creativity": r.skill_creativity, "Logic": r.skill_logic });
const behaviour = (r: Report) => ({ "Tepat waktu": r.behavior_punctual, "Tidak pulang awal": r.behavior_stay, "Komunikasi": r.behavior_communication, "Tanggung jawab": r.behavior_responsibility });

function RapotInner() {
    const parent = useParent((s) => s.parent)!;
    const q = useQuery({
        queryKey: ["ortu-rapot", parent.studentId],
        queryFn: async () => (await api.post<ApiEnvelope<Report[]>>("/e-rapot/parent", { student_id: parent.studentId, phone: parent.phone })).data.data,
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">E-Rapot</h1>
                <p className="text-sm text-muted-foreground">Laporan perkembangan {parent.name}.</p>
            </div>

            {q.isLoading && <Skeleton className="h-40 w-full" />}
            <div className="grid gap-4">
                {q.data?.map((r) => <ReportCard key={r.id} report={r} phone={parent.phone} studentCode={parent.studentCode} />)}
                {q.data && q.data.length === 0 && (
                    <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Belum ada E-Rapot.</CardContent></Card>
                )}
            </div>
        </div>
    );
}

function ReportCard({ report, phone, studentCode }: { report: Report; phone: string; studentCode: string }) {
    const download = useMutation({
        mutationFn: async () => {
            const res = await api.post(`/e-rapot/${report.id}/parent-pdf`, { phone }, { responseType: "blob" });
            const url = URL.createObjectURL(res.data as Blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `E-Rapot-${studentCode}-S${report.semester}-${report.year}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        },
    });

    const Grades = ({ data }: { data: Record<string, string> }) => (
        <div className="grid grid-cols-2 gap-2">
            {Object.entries(data).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
                    <span className="text-muted-foreground">{k}</span><Badge variant="secondary">{v}</Badge>
                </div>
            ))}
        </div>
    );

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-primary" /> Semester {report.semester} · {report.year}</CardTitle>
                <Button size="sm" variant="outline" disabled={download.isPending} onClick={() => download.mutate()}>
                    {download.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Download className="mr-2 h-4 w-4" /> Unduh PDF</>}
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Skill</p>
                    <Grades data={skills(report)} />
                </div>
                <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Behaviour</p>
                    <Grades data={behaviour(report)} />
                </div>
                {report.comments && <p className="rounded-md bg-muted/40 p-3 text-sm">{report.comments}</p>}
            </CardContent>
        </Card>
    );
}

export default function Page() {
    return <ParentShell><RapotInner /></ParentShell>;
}