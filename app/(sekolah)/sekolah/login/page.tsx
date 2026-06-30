"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2, School } from "lucide-react";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

const inputCls = "w-full rounded-md border-2 border-black bg-white px-3 py-2 font-medium outline-none transition focus:shadow-[3px_3px_0_0_#000]";
type LoginData = { token: string; admin: { id: number; name: string; school_id: number } };

export default function SekolahLoginPage() {
    const router = useRouter();
    const { setSession } = useAuth();
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: async () => (await api.post<ApiEnvelope<LoginData>>("/auth/school-admin/login", { login, password })).data,
        onSuccess: (res) => {
            const { token, admin } = res.data;
            setSession(token, { kind: "school_admin", id: admin.id, name: admin.name, school_id: admin.school_id });
            router.replace("/sekolah/dashboard");
        },
        onError: (e) => setErr(apiError(e, "Login gagal.")),
    });

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
            <AnimatedBackground />
            <div className="w-full max-w-md">
                <Link href="/" className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-2 font-display text-sm font-extrabold shadow-[3px_3px_0_0_#000] active:translate-y-[2px] active:shadow-none">
                    <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Kembali
                </Link>

                <form onSubmit={(e) => { e.preventDefault(); setErr(null); mutation.mutate(); }}
                    className="rounded-3xl border-[3px] border-black bg-white p-7 shadow-[6px_6px_0_0_#000] md:p-8">
                    <span className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-black bg-accent shadow-[2px_2px_0_0_#000]">
                        <School className="h-6 w-6" strokeWidth={2.5} />
                    </span>
                    <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">Masuk Admin Sekolah</h1>
                    <p className="mt-1 text-sm font-medium text-ink-muted">Gunakan email atau nomor HP yang didaftarkan.</p>

                    <div className="mt-5 space-y-4">
                        <label className="block">
                            <span className="mb-1 block font-display text-sm font-bold">Email / Nomor HP</span>
                            <input className={inputCls} value={login} onChange={(e) => setLogin(e.target.value)} />
                        </label>
                        <label className="block">
                            <span className="mb-1 block font-display text-sm font-bold">Kata sandi</span>
                            <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
                        </label>
                    </div>

                    {err && <p className="mt-3 text-sm font-semibold text-red-600">{err}</p>}

                    <button type="submit" disabled={!login || !password || mutation.isPending}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border-[3px] border-black bg-primary py-3 font-display text-sm font-extrabold text-white shadow-[5px_5px_0_0_#000] disabled:opacity-60 active:translate-y-[4px] active:shadow-none">
                        {mutation.isPending ? <><Loader2 className="h-5 w-5 animate-spin" /> Memproses…</> : "Masuk"}
                    </button>
                </form>
            </div>
        </main>
    );
}