"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";
import { TOKEN_KEY, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { usePathname, useRouter } from "next/navigation";

export function SchoolGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { actor, setSession } = useAuth();
    const [ready, setReady] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const toLogin = () => router.replace(`/sekolah/login?redirect=${encodeURIComponent(pathname)}`);

        const token = Cookies.get(TOKEN_KEY);
        if (!token) { toLogin(); return; }
        if (actor?.kind === "school_admin") { setReady(true); return; }

        api.get("/auth/me")
            .then((res) => {
                const u = res.data.data;
                setSession(null, { kind: "school_admin", id: u.id, name: u.name, school_id: u.school_id });
                setReady(true);
            })
            .catch(() => { Cookies.remove(TOKEN_KEY); toLogin(); });
    }, []); // eslint-disable-line

    if (!ready) {
        return <div className="grid min-h-screen place-items-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;
    }
    return <>{children}</>;
}