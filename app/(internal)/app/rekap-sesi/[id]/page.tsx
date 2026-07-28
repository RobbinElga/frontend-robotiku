"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, User, ImageIcon } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { AuthImage } from "@/components/ui/auth-image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const MapPreview = dynamic(() => import("@/components/ui/map-preview"), { ssr: false });

type Att = { id: number; name: string; student_code: string; status: string; score: string | null; report: string | null; photo: string | null };
type Detail = { session: { id: number; status: string; started_at: string; ended_at: string | null; kelas: string | null; trainer: string | null; start_photo: string | null; end_photo: string | null; start_lat: number | null; start_lng: number | null }; attendances: Att[] };

const jam = (s?: string | null) => (s ? new Date(s).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
const STCLS: Record<string, string> = { hadir: "border-emerald-200 bg-emerald-50 text-emerald-700", izin: "border-blue-200 bg-blue-50 text-blue-700", sakit: "border-amber-200 bg-amber-50 text-amber-700", tanpa_keterangan: "border-red-200 bg-red-50 text-red-700" };
const STLABEL: Record<string, string> = { hadir: "Hadir", izin: "Izin", sakit: "Sakit", tanpa_keterangan: "Alpa" };

export default function RekapDetail() {
    const { id } = useParams<{ id: string }>();
    const { data, isLoading } = useQuery({ queryKey: ["rekap-detail", id], queryFn: async () => (await api.get<ApiEnvelope<Detail>>(`/sesi/${id}/detail`)).data.data });

    return (
        <InternalShell>
            <div className="mx-auto max-w-3xl">
                <Link href="/app/rekap-sesi" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Kembali</Link>

                {isLoading || !data ? <Skeleton className="h-96 rounded-xl" /> : (
                    <div className="space-y-6">
                        <Card className="border-2 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h1 className="text-xl font-semibold">{data.session.kelas}</h1>
                                    <p className="flex items-center gap-1 text-sm text-muted-foreground"><User className="h-3.5 w-3.5" /> {data.session.trainer}</p>
                                </div>
                                <Badge variant="outline" className={data.session.status === "ended" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700"}>{data.session.status === "ended" ? "Selesai" : "Berlangsung"}</Badge>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-lg border bg-muted/30 p-3"><div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> Mulai</div><div className="mt-0.5 font-medium">{jam(data.session.started_at)}</div></div>
                                <div className="rounded-lg border bg-muted/30 p-3"><div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> Selesai</div><div className="mt-0.5 font-medium">{jam(data.session.ended_at)}</div></div>
                            </div>

                            {data.session.start_lat != null && data.session.start_lng != null && (
                                <div className="mt-3"><MapPreview lat={data.session.start_lat} lng={data.session.start_lng} height={160} /></div>
                            )}

                            <div className="mt-3 grid grid-cols-2 gap-3">
                                {data.session.start_photo && <div><div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground"><ImageIcon className="h-3 w-3" /> Foto Mulai</div><AuthImage path={data.session.start_photo} alt="mulai" className="aspect-video w-full rounded-lg border object-cover" /></div>}
                                {data.session.end_photo && <div><div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground"><ImageIcon className="h-3 w-3" /> Foto Selesai</div><AuthImage path={data.session.end_photo} alt="selesai" className="aspect-video w-full rounded-lg border object-cover" /></div>}
                            </div>
                        </Card>

                        <Card className="border-2 p-5">
                            <h3 className="mb-3 text-sm font-semibold">Kehadiran Murid ({data.attendances.length})</h3>
                            <ul className="space-y-2">
                                {data.attendances.map((a) => (
                                    <li key={a.id} className="rounded-lg border p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0"><div className="truncate font-medium">{a.name}</div><div className="font-mono text-xs text-muted-foreground">{a.student_code}</div></div>
                                            <div className="flex items-center gap-2">
                                                {a.score && <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{a.score}</span>}
                                                <Badge variant="outline" className={STCLS[a.status]}>{STLABEL[a.status]}</Badge>
                                            </div>
                                        </div>
                                        {a.report && <div className="mt-2 rounded bg-muted/40 p-2 text-sm" dangerouslySetInnerHTML={{ __html: a.report }} />}
                                        {a.photo && <AuthImage path={a.photo} alt="foto" className="mt-2 max-h-40 rounded-md border object-cover" />}
                                    </li>
                                ))}
                                {!data.attendances.length && <p className="text-sm text-muted-foreground">Belum ada absensi.</p>}
                            </ul>
                        </Card>
                    </div>
                )}
            </div>
        </InternalShell>
    );
}