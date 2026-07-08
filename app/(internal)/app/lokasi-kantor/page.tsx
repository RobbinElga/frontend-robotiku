"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MapPin, Building2, CheckCircle2 } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MapPicker = dynamic(() => import("@/components/ui/map-picker"), { ssr: false });
type Office = { latitude: string | null; longitude: string | null; radius: number };

export default function LokasiKantorPage() {
    const { data } = useQuery({ queryKey: ["office-loc"], queryFn: async () => (await api.get<ApiEnvelope<Office>>("/pengaturan/lokasi-kantor")).data.data });
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [radius, setRadius] = useState(500);
    const [seeded, setSeeded] = useState(false);

    useEffect(() => {
        if (data && !seeded) {
            setLat(data.latitude ? Number(data.latitude) : null);
            setLng(data.longitude ? Number(data.longitude) : null);
            setRadius(data.radius ?? 500);
            setSeeded(true);
        }
    }, [data, seeded]);

    const save = useMutation({ mutationFn: async () => api.put("/pengaturan/lokasi-kantor", { latitude: lat, longitude: lng, radius }) });

    return (
        <InternalShell>
            <PageHeader title="Lokasi Kantor" subtitle="Titik & radius absensi GPS untuk kelas mandiri (di kantor)." />
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <Card className="p-4 sm:p-5">
                    <MapPicker lat={lat} lng={lng} radius={radius} onChange={(la, ln) => { setLat(la); setLng(ln); }} />
                </Card>

                <Card className="h-fit p-5">
                    <h3 className="flex items-center gap-1.5 text-sm font-semibold"><Building2 className="h-4 w-4" /> Pengaturan Radius</h3>
                    <div className="mt-4">
                        <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Radius toleransi</span>
                            <span className="font-semibold">{radius} m</span>
                        </div>
                        <input type="range" min={50} max={2000} step={50} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full accent-primary" />
                        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>50 m</span><span>2 km</span></div>
                    </div>

                    <div className="mt-4 rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> Koordinat terpilih</div>
                        <div className="mt-1 font-mono text-xs">{lat != null && lng != null ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "Belum dipilih"}</div>
                    </div>

                    <Button className="mt-4 w-full" disabled={lat == null || lng == null || save.isPending} onClick={() => save.mutate()}>
                        {save.isPending ? "Menyimpan…" : "Simpan Lokasi Kantor"}
                    </Button>
                    {save.isSuccess && <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Tersimpan.</p>}
                    <p className="mt-3 text-xs text-muted-foreground">Kelas mandiri divalidasi ke titik ini; kelas instansi ke titik sekolah masing-masing.</p>
                </Card>
            </div>
        </InternalShell>
    );
}