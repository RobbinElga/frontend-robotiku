"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, BadgeCheck, History, Landmark, CreditCard, Receipt, UserCog, LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useConfirm } from "@/components/ui/confirm";
import { BottomNav, type NavItem } from "@/components/ui/BottomNav";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

const NAV: NavItem[] = [
    { href: "/sekolah/dashboard", label: "Beranda", icon: LayoutDashboard },
    { href: "/sekolah/murid", label: "Murid", icon: Users },
    { href: "/sekolah/tagihan", label: "Tagihan", icon: Receipt },
    { href: "/sekolah/pembayaran-masuk", label: "Verifikasi Bayar", icon: BadgeCheck },
    { href: "/sekolah/riwayat", label: "Riwayat", icon: History },
    { href: "/sekolah/setoran", label: "Setoran Robotiku", icon: Landmark },
    { href: "/sekolah/rekening", label: "Rekening", icon: CreditCard },
    { href: "/sekolah/akun", label: "Akun Saya", icon: UserCog },
];
// BottomNav maksimal 5 ikon → pilih yang paling sering dipakai. Riwayat/Rekening/Akun via sidebar & ikon header.
const MOBILE_NAV: NavItem[] = [
    NAV[0], // Beranda
    NAV[1], // Murid
    NAV[2], // Tagihan
    NAV[3], // Verifikasi Bayar
    NAV[5], // Setoran Robotiku
];

export function SchoolShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const isMobile = useIsMobile();
    const confirm = useConfirm();

    const actor = useAuth((s) => s.actor);
    const clear = useAuth((s) => s.clear);
    const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

    const logout = async () => {
        const ok = await confirm({ title: "Keluar?", description: "Anda akan keluar dari portal sekolah.", confirmText: "Keluar", variant: "destructive" });
        if (!ok) return;
        try { await api.post("/auth/logout"); } catch { /* abaikan */ }
        clear();
        router.replace("/sekolah/login");
    };

    return (
        <div className="flex min-h-screen bg-muted/30">
            {/* SIDEBAR desktop */}
            <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-background md:flex">
                <div className="flex h-14 items-center gap-2 border-b px-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">R</div>
                    <span className="font-semibold">Portal Sekolah</span>
                </div>
                <nav className="flex-1 space-y-1 p-2">
                    {NAV.map((it) => {
                        const Icon = it.icon;
                        const active = isActive(it.href);
                        return (
                            <Link key={it.href} href={it.href}
                                className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                                    active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted")}>
                                <Icon className="h-4 w-4" /> {it.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur">
                    <div className="flex items-center gap-2 md:hidden">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">R</div>
                        <span className="font-semibold">Portal Sekolah</span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <div className="hidden text-right sm:block">
                            <div className="text-sm font-medium leading-tight">{actor?.name ?? "Admin Sekolah"}</div>
                            <div className="text-xs text-muted-foreground">Admin Sekolah</div>
                        </div>
                        <Link href="/sekolah/akun" title="Akun Saya"
                            className={cn("flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary",
                                isActive("/sekolah/akun") && "bg-primary/10 text-primary")}>
                            <UserCog className="h-4 w-4" />
                        </Link>
                        <button onClick={logout} title="Keluar"
                            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-red-600">
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>
            </div>

            {isMobile && <BottomNav items={MOBILE_NAV} />}
        </div>
    );
}