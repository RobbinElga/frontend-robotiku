"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api, TOKEN_KEY } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { INTERNAL_ROLES, navItemForPath, type Role } from "./nav-config";

/** Guard sesi + otorisasi rute untuk seluruh area /app/*. */
export function useInternalGuard(): { ready: boolean; role: Role | null } {
    const actor = useAuth((s) => s.actor);
    const setActor = useAuth((s) => s.setActor);
    const clear = useAuth((s) => s.clear);
    const router = useRouter();
    const pathname = usePathname();
    const [ready, setReady] = useState(false);

    // (1) autentikasi: butuh token + sesi user internal, rehidrasi dari /auth/me bila perlu
    useEffect(() => {
        let alive = true;
        const token = Cookies.get(TOKEN_KEY);

        if (!token) { router.replace("/app/login"); return; }
        if (actor?.kind === "user") { setReady(true); return; }

        (async () => {
            try {
                const me = (await api.get("/auth/me")).data.data;
                if (!alive) return;
                const role = me?.role as string | undefined;
                if (!role || !INTERNAL_ROLES.includes(role as Role)) { clear(); router.replace("/app/login"); return; }
                setActor({ kind: "user", id: me.id, name: me.name, role });
                setReady(true);
            } catch {
                if (!alive) return;
                clear();
                router.replace("/app/login"); // token invalid/kedaluwarsa
            }
        })();

        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const role = actor?.kind === "user" ? (actor.role as Role) : null;

    // (2) otorisasi per-rute (defense in depth — server tetap enforce via RBAC)
    useEffect(() => {
        if (!ready || !role) return;
        const item = navItemForPath(pathname);
        if (item && !item.roles.includes(role)) {
            // Logika pengalihan cerdas berdasarkan role agar tidak infinite loop
            if (role === "marketing") {
                router.replace("/app/canvas/dashboardmarketing");
            } else {
                router.replace("/app/dashboard");
            }
        }
    }, [ready, role, pathname, router]);

    return { ready, role };
}