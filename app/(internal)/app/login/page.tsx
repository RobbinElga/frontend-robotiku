"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Bot, ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";

type LoginData = { token: string; user: { id: number; name: string; email: string; role: string } };

export default function InternalLoginPage() {
    const router = useRouter();
    const { setSession } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: async () => (await api.post<ApiEnvelope<LoginData>>("/auth/login", { email, password })).data,
        onSuccess: (res) => { const { token, user } = res.data; setSession(token, { kind: "user", id: user.id, name: user.name, role: user.role }); router.replace("/app/dashboard"); },
        onError: (e) => setErr(apiError(e, "Email atau kata sandi salah.")),
    });

    return (
        <main className="grid min-h-screen lg:grid-cols-2">
            {/* panel brand */}
            <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
                <div className="flex items-center gap-2 font-semibold"><Bot className="h-6 w-6" /> RobotiKU</div>
                <div>
                    <h1 className="text-4xl font-semibold leading-tight">Panel Internal<br />Sistem Manajemen Robotiku</h1>
                    <p className="mt-4 max-w-sm text-primary-foreground/80">Kelola siswa, kelas, pembayaran, CRM sekolah, dan lainnya dari satu tempat.</p>
                </div>
                <p className="text-sm text-primary-foreground/70">© 2026 Yayasan Tadika Cikal Mulia</p>
                <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10" />
                <div className="pointer-events-none absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-white/5" />
            </div>

            {/* form */}
            <div className="flex items-center justify-center bg-background p-6">
                <div className="w-full max-w-sm">
                    {/* LOGO — ganti dengan <img src="/logo.png" alt="RobotiKU" className="h-16 w-16" /> nanti */}
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10">
                        <Bot className="h-8 w-8" />
                    </div>

                    <h2 className="text-[1.7rem] font-semibold leading-tight tracking-tight text-foreground">Selamat datang kembali</h2>
                    <p className="mt-1.5 text-[0.95rem] text-muted-foreground">Masuk dengan akun staf Anda untuk melanjutkan.</p>

                    {err && (
                        <div className="mt-5 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{err}</span>
                        </div>
                    )}

                    <form onSubmit={(e) => { e.preventDefault(); setErr(null); mutation.mutate(); }} className="mt-7 space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                                <Input id="email" type="email" className="h-12 pl-11 text-base" placeholder="nama@robotiku.id" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium text-foreground">Kata sandi</Label>
                            </div>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                                <Input id="password" type={showPw ? "text" : "password"} className="h-12 pl-11 pr-11 text-base" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" tabIndex={-1} aria-label="Tampilkan sandi">
                                    {showPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="h-12 w-full text-base font-medium" disabled={!email || !password || mutation.isPending}>
                            {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses…</> : "Masuk"}
                        </Button>
                    </form>

                    <p className="mt-7 text-center text-xs text-muted-foreground">Halaman khusus staf internal RobotiKU.</p>
                </div>
            </div>
        </main>
    );
}