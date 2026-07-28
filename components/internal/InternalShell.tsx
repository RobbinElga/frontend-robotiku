"use client";

import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useConfirm } from "@/components/ui/confirm";
import { BottomNav } from "@/components/ui/BottomNav";
import { useIsMobile } from "@/hooks/useIsMobile";
import { NAV, navItemForPath } from "./nav-config";
import { useInternalGuard } from "./use-internal-guard";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

function FullScreen({ text }: { text: string }) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground"><span className="animate-pulse">{text}</span></div>;
}

export function InternalShell({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const confirm = useConfirm();
    const isMobile = useIsMobile();

    const actor = useAuth((s) => s.actor);
    const clear = useAuth((s) => s.clear);
    const { ready, role } = useInternalGuard();

    const logout = async () => {
        const ok = await confirm({ title: "Keluar?", description: "Anda akan keluar dari sesi ini.", confirmText: "Keluar", variant: "destructive" });
        if (!ok) return;
        try { await api.post("/auth/logout"); } catch { /* abaikan */ }
        clear();
        router.replace("/app/login"); // ← sebelumnya "/login"
    };

    // belum lolos guard → jangan render apa pun (cegah bocornya menu/isi)
    if (!ready || !role) return <FullScreen text="Memeriksa sesi…" />;

    // rute tak diizinkan untuk role ini → tampilkan placeholder sementara redirect
    const current = navItemForPath(pathname);
    if (current && !current.roles.includes(role)) return <FullScreen text="Mengalihkan…" />;

    const nav = NAV.filter((n) => n.roles.includes(role));
    const name = actor?.kind === "user" ? actor.name : "Pengguna";

    return (
        <div className="flex min-h-screen bg-muted/30">
            <Sidebar role={role} />
            <div className="flex min-w-0 flex-1 flex-col">
                <Topbar name={name} role={role} onLogout={logout} />
                <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>
            </div>
            {isMobile && <BottomNav items={nav} />}
        </div>
    );
}