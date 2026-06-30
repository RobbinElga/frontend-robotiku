"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Search, Loader2, ArrowLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { useParent } from "@/lib/parent-store";

type Student = { id: number; student_code: string; name: string; parent: { phone: string } };

export default function OrtuLookupPage() {
    const router = useRouter();
    const { setParent } = useParent();
    const [query, setQuery] = useState("");
    const [students, setStudents] = useState<Student[] | null>(null);
    const [msg, setMsg] = useState<string | null>(null);

    const pick = (s: Student) => {
        setParent({ studentId: s.id, name: s.name, studentCode: s.student_code, phone: s.parent.phone });
        router.push("/ortu/tagihan");
    };

    const lookup = useMutation({
        mutationFn: async () => {
            const isPhone = /^[\d+\s-]+$/.test(query.trim());
            return (await api.post<ApiEnvelope<{ students: Student[] }>>("/auth/parent/lookup", isPhone ? { phone: query } : { name: query })).data;
        },
        onSuccess: (res) => { setMsg(null); const list = res.data.students; if (list.length === 1) pick(list[0]); else setStudents(list); },
        onError: (e) => { setStudents(null); setMsg(apiError(e, "Data tidak ditemukan.")); },
    });

    return (
        <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <div className="w-full max-w-md">
                <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Kembali</Link>
                <Card>
                    <CardHeader>
                        <CardTitle>Portal Orang Tua</CardTitle>
                        <p className="text-sm text-muted-foreground">Masuk dengan nama anak atau nomor HP terdaftar — tanpa kata sandi.</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={(e) => { e.preventDefault(); lookup.mutate(); }} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input className="pl-9" placeholder="Nama anak / 08xxxx" value={query} onChange={(e) => setQuery(e.target.value)} />
                            </div>
                            <Button type="submit" disabled={!query || lookup.isPending}>
                                {lookup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cari"}
                            </Button>
                        </form>
                        {msg && <p className="mt-3 text-sm text-destructive">{msg}</p>}

                        {students && students.length > 1 && (
                            <div className="mt-4 space-y-2">
                                <p className="text-sm font-medium">Pilih anak:</p>
                                {students.map((s) => (
                                    <button key={s.id} onClick={() => pick(s)} className="flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm hover:bg-muted">
                                        <span className="font-medium">{s.name}</span>
                                        <span className="flex items-center gap-1 text-muted-foreground">{s.student_code} <ChevronRight className="h-4 w-4" /></span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}