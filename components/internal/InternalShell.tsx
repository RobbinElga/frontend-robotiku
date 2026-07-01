"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    LayoutDashboard, Workflow, BadgeCheck, GraduationCap, FileText, MapPin,
    Users, BookOpen, Ticket, Newspaper, Globe, UserCog, Bell, LogOut,
    PanelLeftClose, PanelLeft, type LucideIcon, BookMarked,
    School
} from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useConfirm } from "@/components/ui/confirm";
import { BottomNav, type NavItem } from "@/components/ui/BottomNav";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

type Role = "super_admin" | "admin" | "marketing" | "trainer" | "admin_keuangan";
type Item = NavItem & { roles: Role[] };

const NAV: Item[] = [
    { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "admin", "marketing", "trainer", "admin_keuangan"] },
    { href: "/app/canvas", label: "Canvas", icon: Workflow, roles: ["super_admin", "admin", "marketing"] },
    { href: "/app/verifikasi", label: "Verifikasi Bayar", icon: BadgeCheck, roles: ["super_admin", "admin", "admin_keuangan"] },
    { href: "/app/murid", label: "Manajemen Murid", icon: GraduationCap, roles: ["super_admin", "admin", "trainer"] },
    { href: "/app/e-rapot", label: "E-Rapot", icon: FileText, roles: ["super_admin", "admin", "trainer"] },
    { href: "/app/presensi", label: "Presensi", icon: MapPin, roles: ["super_admin", "admin", "trainer"] },
    { href: "/app/siswa", label: "Data Siswa", icon: Users, roles: ["super_admin", "admin"] },
    { href: "/app/kelas", label: "Data Kelas", icon: BookOpen, roles: ["super_admin", "admin"] },
    { href: "/app/program", label: "Program", icon: BookMarked, roles: ["super_admin", "admin"] },
    { href: "/app/promo", label: "Kode Promo", icon: Ticket, roles: ["super_admin", "admin"] },
    { href: "/app/artikel", label: "Artikel", icon: Newspaper, roles: ["super_admin", "admin"] },
    { href: "/app/landing", label: "Landing CMS", icon: Globe, roles: ["super_admin", "admin"] },
    { href: "/app/akun-sekolah", label: "Akun Sekolah", icon: School, roles: ["super_admin", "admin"] },
    { href: "/app/akun", label: "Manajemen Akun", icon: UserCog, roles: ["super_admin"] },
];

const ROLE_LABEL: Record<Role, string> = {
    super_admin: "Super Admin", admin: "Admin", marketing: "Marketing",
    trainer: "Trainer", admin_keuangan: "Admin Keuangan",
};

export function InternalShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const isMobile = useIsMobile();
    const confirm = useConfirm();

    const actor = useAuth((s) => s.actor);
    const clear = useAuth((s) => s.clear);
    const role = (actor?.kind === "user" ? actor.role : "trainer") as Role;

    const [collapsed, setCollapsed] = useState(false);

    const nav = NAV.filter((n) => n.roles.includes(role));
    const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

    const logout = async () => {
        const ok = await confirm({ title: "Keluar?", description: "Anda akan keluar dari sesi ini.", confirmText: "Keluar", variant: "destructive" });
        if (!ok) return;
        try { await api.post("/auth/logout"); } catch { /* abaikan */ }
        clear();
        router.replace("/login");
    };

    return (
        <div className="flex min-h-screen bg-muted/30">
            {/* SIDEBAR — desktop */}
            <aside className={cn(
                "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-background transition-[width] md:flex",
                collapsed ? "w-16" : "w-64",
            )}>
                <div className="flex h-14 items-center gap-2 border-b px-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">R</div>
                    {!collapsed && <span className="font-semibold">Robotiku</span>}
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto p-2">
                    {nav.map((it) => {
                        const Icon = it.icon;
                        const active = isActive(it.href);
                        return (
                            <Link key={it.href} href={it.href} title={collapsed ? it.label : undefined}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                                    active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted",
                                    collapsed && "justify-center px-0",
                                )}>
                                <Icon className="h-4 w-4 shrink-0" />
                                {!collapsed && <span className="truncate">{it.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <button onClick={() => setCollapsed((c) => !c)}
                    className="flex items-center gap-2 border-t px-4 py-3 text-xs text-muted-foreground hover:bg-muted">
                    {collapsed ? <PanelLeft className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /> Ciutkan</>}
                </button>
            </aside>

            {/* MAIN */}
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur">
                    <div className="flex items-center gap-2 md:hidden">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">R</div>
                        <span className="font-semibold">Robotiku</span>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <NotifBell />
                        <div className="hidden text-right sm:block">
                            <div className="text-sm font-medium leading-tight">{actor?.name ?? "Pengguna"}</div>
                            <div className="text-xs text-muted-foreground">{ROLE_LABEL[role]}</div>
                        </div>
                        <button onClick={logout} title="Keluar"
                            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-red-600">
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>
            </div>

            {isMobile && <BottomNav items={nav} />}
        </div>
    );
}

// ---------------------------------------------------------------- notif bell
type Notif = { id: number; title: string; message: string; is_read: boolean; created_at: string };

function NotifBell() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const qc = useQueryClient();

    const { data } = useQuery({
        queryKey: ["notif"],
        queryFn: async () => (await api.get<ApiEnvelope<{ data: Notif[] }>>("/notifikasi")).data.data.data,
        refetchInterval: 30000,
    });
    const items = data ?? [];
    const unread = items.filter((n) => !n.is_read).length;

    useEffect(() => {
        const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const markRead = async (id: number) => {
        try { await api.post(`/notifikasi/${id}/read`); qc.invalidateQueries({ queryKey: ["notif"] }); } catch { /* abaikan */ }
    };

    return (
        <div ref={ref} className="relative">
            <button onClick={() => setOpen((o) => !o)}
                className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-lg border bg-background shadow-lg">
                    <div className="border-b px-4 py-2.5 text-sm font-semibold">Notifikasi</div>
                    <div className="max-h-80 divide-y overflow-y-auto">
                        {items.length ? items.map((n) => (
                            <button key={n.id} onClick={() => markRead(n.id)}
                                className={cn("block w-full px-4 py-3 text-left hover:bg-muted", !n.is_read && "bg-primary/5")}>
                                <div className="flex items-start gap-2">
                                    {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium">{n.title}</div>
                                        <div className="truncate text-xs text-muted-foreground">{n.message}</div>
                                    </div>
                                </div>
                            </button>
                        )) : <p className="px-4 py-8 text-center text-sm text-muted-foreground">Tidak ada notifikasi.</p>}
                    </div>
                </div>
            )}
        </div>
    );
}