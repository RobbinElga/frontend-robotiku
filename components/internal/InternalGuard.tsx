"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";
import { TOKEN_KEY, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";

export function InternalGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { actor, setSession } = useAuth();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const token = Cookies.get(TOKEN_KEY);
        if (!token) { router.replace("/app/login"); return; }
        if (actor?.kind === "user") { setReady(true); return; }

        api.get("/auth/me")
            .then((res) => {
                const u = res.data.data;
                if (!u?.role) throw new Error("bukan akun internal");
                setSession(null, { kind: "user", id: u.id, name: u.name, role: u.role });
                setReady(true);
            })
            .catch(() => { Cookies.remove(TOKEN_KEY); router.replace("/app/login"); });
    }, []); // eslint-disable-line

    if (!ready) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;
    return <>{children}</>;
}