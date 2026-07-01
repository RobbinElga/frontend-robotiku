"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Camera, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { cn } from "@/lib/utils";

type StudentMini = { id: number; student_code: string; name: string; status: string };
type Kelas = { id: number; name: string; schedule: string | null; students: StudentMini[] };

const statusOpts = [
    { v: "hadir", l: "Hadir", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { v: "izin", l: "Izin", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    { v: "tidak_hadir", l: "Tidak Hadir", cls: "bg-rose-50 text-rose-700 border-rose-200" },
];

function MuridInner() {
    const [classId, setClassId] = useState<string>("");
    const [absen, setAbsen] = useState<{ student: StudentMini } | null>(null);

    const classes = useQuery({ queryKey: ["trainer-kelas"], queryFn: async () => (await api.get<ApiEnvelope<Kelas[]>>("/trainer/kelas")).data.data });
    const selected = classes.data?.find((c) => String(c.id) === classId);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Absensi Murid</h1>
                <p className="text-sm text-muted-foreground">Pilih kelas lalu catat kehadiran tiap murid.</p>
            </div>

            {classes.isLoading ? <Skeleton className="h-10 w-64" /> : (
                <div className="max-w-xs">
                    <Label>Kelas</Label>
                    <Select value={classId} onValueChange={(v) => setClassId(v ?? "")}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih kelas Anda" /></SelectTrigger>
                        <SelectContent>
                            {classes.data?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}{c.schedule ? ` — ${c.schedule}` : ""}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {classes.data && classes.data.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Belum ada kelas yang ditugaskan ke Anda.</p>}
                </div>
            )}

            {selected && (
                <Card>
                    <CardHeader><CardTitle className="text-base">Murid — {selected.name}</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {selected.students.length === 0 && <p className="text-sm text-muted-foreground">Belum ada murid di kelas ini.</p>}
                        {selected.students.map((s) => (
                            <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9"><AvatarFallback>{s.name[0]}</AvatarFallback></Avatar>
                                    <div><p className="font-medium leading-none">{s.name}</p><p className="mt-1 text-xs text-muted-foreground">{s.student_code}</p></div>
                                </div>
                                <Button size="sm" onClick={() => setAbsen({ student: s })}>Absen</Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {absen && selected && (
                <AbsensiDialog classId={selected.id} student={absen.student} onClose={() => setAbsen(null)} />
            )}
        </div>
    );
}

function AbsensiDialog({ classId, student, onClose }: { classId: number; student: StudentMini; onClose: () => void }) {
    const qc = useQueryClient();
    const [status, setStatus] = useState("hadir");
    const [report, setReport] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [done, setDone] = useState<string | null>(null);

    const save = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            fd.append("class_id", String(classId));
            fd.append("student_id", String(student.id));
            fd.append("status", status);
            if (report) fd.append("report", report);
            if (photo) fd.append("photo", photo);
            return (await api.post("/absensi", fd)).data;
        },
        onSuccess: (res: any) => {
            setDone(res.data?.new_invoice ? `Absensi tersimpan. Tagihan baru dibuat: ${res.data.new_invoice}` : "Absensi tersimpan.");
            qc.invalidateQueries({ queryKey: ["trainer-kelas"] });
        },
        onError: (e) => setErr(apiError(e, "Gagal menyimpan absensi.")),
    });

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader><DialogTitle>Absensi — {student.name}</DialogTitle></DialogHeader>
                {done ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"><Check className="h-4 w-4" /> {done}</div>
                        <Button className="w-full" onClick={onClose}>Selesai</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <Label>Status kehadiran</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v ?? "hadir")}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>{statusOpts.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Laporan deskriptif</Label>
                            <Textarea className="mt-1" rows={3} placeholder="Catatan perkembangan murid…" value={report} onChange={(e) => setReport(e.target.value)} />
                        </div>
                        <div>
                            <Label className="flex items-center gap-2"><Camera className="h-4 w-4" /> Foto (opsional)</Label>
                            <input type="file" accept="image/*" capture="environment" className="mt-1 block w-full text-sm file:mr-3 file:rounded-md file:border file:bg-muted file:px-3 file:py-1.5" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
                        </div>
                        {err && <p className="text-sm text-destructive">{err}</p>}
                        <Button className="w-full" disabled={save.isPending} onClick={() => { setErr(null); save.mutate(); }}>
                            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Absensi"}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default function Page() {
    return <InternalShell><MuridInner /></InternalShell>;
}