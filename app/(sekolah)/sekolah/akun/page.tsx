"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, KeyRound } from "lucide-react";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { SchoolShell } from "@/components/sekolah/SchoolShell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SekolahAkunPage() {
    const [cur, setCur] = useState("");
    const [pw, setPw] = useState("");
    const [conf, setConf] = useState("");
    const [ok, setOk] = useState("");
    const [err, setErr] = useState("");

    const save = useMutation({
        mutationFn: async () => api.post<ApiEnvelope<null>>("/sekolah/ganti-password", {
            current_password: cur, password: pw, password_confirmation: conf,
        }),
        onSuccess: () => { setOk("Password berhasil diperbarui."); setCur(""); setPw(""); setConf(""); },
        onError: (e) => setErr(apiError(e, "Gagal memperbarui password.")),
    });

    const mismatch = conf.length > 0 && pw !== conf;

    return (
        <SchoolShell>
            <PageHeader title="Akun Saya" subtitle="Ubah password akun admin sekolah Anda." />
            <Card className="mt-3 max-w-md border-2 p-6">
                <div className="mb-4 flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4 text-primary" /> Ganti Password</div>
                {ok && <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{ok}</div>}
                {err && <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
                <div className="space-y-3">
                    <div className="space-y-1.5"><Label>Password saat ini</Label><Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} /></div>
                    <div className="space-y-1.5"><Label>Password baru</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Min. 8 karakter" /></div>
                    <div className="space-y-1.5"><Label>Ulangi password baru</Label><Input type="password" value={conf} onChange={(e) => setConf(e.target.value)} />{mismatch && <p className="text-xs text-red-600">Konfirmasi tidak cocok.</p>}</div>
                </div>
                <Button className="mt-4" disabled={save.isPending || !cur || pw.length < 8 || mismatch} onClick={() => { setOk(""); setErr(""); save.mutate(); }}>
                    {save.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null} Simpan
                </Button>
            </Card>
        </SchoolShell>
    );
}