"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    const [err, setErr] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: async () => (await api.post<ApiEnvelope<LoginData>>("/auth/login", { email, password })).data,
        onSuccess: (res) => {
            const { token, user } = res.data;
            setSession(token, { kind: "user", id: user.id, name: user.name, role: user.role });
            router.replace("/app/dashboard");
        },
        onError: (e) => setErr(apiError(e, "Login gagal.")),
    });

    return (
        <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ShieldCheck className="h-6 w-6" /></div>
                    <CardTitle>Masuk Panel Internal</CardTitle>
                    <p className="text-sm text-muted-foreground">Khusus staf RobotiKU.</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={(e) => { e.preventDefault(); setErr(null); mutation.mutate(); }} className="space-y-4">
                        <div><Label>Email</Label><Input type="email" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                        <div><Label>Kata sandi</Label><Input type="password" className="mt-1" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                        {err && <p className="text-sm text-destructive">{err}</p>}
                        <Button type="submit" className="w-full" disabled={!email || !password || mutation.isPending}>
                            {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses…</> : "Masuk"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}