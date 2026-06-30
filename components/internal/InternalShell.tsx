"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
    LayoutDashboard, KanbanSquare, BadgeCheck, ClipboardList, FileText, MapPin,
    Users, GraduationCap, Tag, Newspaper, Layout, Bell, ShieldCheck, LogOut, Bot, Menu,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { InternalGuard } from "@/components/internal/InternalGuard";
import { cn } from "@/lib/utils";

type Role = "super_admin" | "admin" | "marketing" | "trainer" | "admin_keuangan";

const nav: { href: string; label: string; icon: any; roles: Role[] }[] = [
    { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "admin", "marketing", "trainer", "admin_keuangan"] },
    { href: "/app/canvas", label: "Canvas CRM", icon: KanbanSquare, roles: ["marketing", "admin", "super_admin"] },
    { href: "/app/verifikasi", label: "Verifikasi Bayar", icon: BadgeCheck, roles: ["admin_keuangan", "admin", "super_admin"] },
    { href: "/app/murid", label: "Manajemen Murid", icon: ClipboardList, roles: ["trainer", "admin", "super_admin"] },
    { href: "/app/e-rapot", label: "E-Rapot", icon: FileText, roles: ["trainer", "admin", "super_admin"] },
    { href: "/app/presensi", label: "Absensi Karyawan", icon: MapPin, roles: ["trainer", "admin", "super_admin"] },
    { href: "/app/siswa", label: "Data Siswa", icon: Users, roles: ["admin", "super_admin"] },
    { href: "/app/kelas", label: "Kelas", icon: GraduationCap, roles: ["admin", "super_admin"] },
    { href: "/app/promo", label: "Promo", icon: Tag, roles: ["admin", "super_admin"] },
    { href: "/app/artikel", label: "Artikel", icon: Newspaper, roles: ["admin", "super_admin"] },
    { href: "/app/landing", label: "Landing CMS", icon: Layout, roles: ["admin", "super_admin"] },
    { href: "/app/notifikasi", label: "Notifikasi", icon: Bell, roles: ["admin_keuangan", "admin", "super_admin"] },
    { href: "/app/akun", label: "Manajemen Akun", icon: ShieldCheck, roles: ["super_admin"] },
];

const roleLabel: Record<string, string> = {
    super_admin: "Super Admin", admin: "Admin", marketing: "Marketing", trainer: "Trainer", admin_keuangan: "Admin Keuangan",
};

function NavLinks({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
    const path = usePathname();
    const items = nav.filter((n) => n.roles.includes(role as Role));
    return (
        <nav className="space-y-1">
            {items.map(({ href, label, icon: Icon }) => {
                const active = path === href;
                return (
                    <Link key={href} href={href} onClick={onNavigate}
                        className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                        <Icon className="h-5 w-5" /> {label}
                    </Link>
                );
            })}
        </nav>
    );
}

function Inner({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { actor, clear } = useAuth();
    const role = actor?.kind === "user" ? actor.role : "admin";
    const name = actor?.kind === "user" ? actor.name : "Staf";

    const logout = useMutation({
        mutationFn: async () => api.post("/auth/logout"),
        onSettled: () => { clear(); router.replace("/app/login"); },
    });

    const Brand = (
        <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></div>
            <div><p className="text-sm font-semibold">RobotiKU</p><p className="text-xs text-muted-foreground">Panel Internal</p></div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-muted/30">
            <aside className="hidden w-64 shrink-0 flex-col border-r bg-background p-3 md:flex">
                <div className="py-4">{Brand}</div>
                <div className="mt-2 flex-1 overflow-y-auto"><NavLinks role={role} /></div>
                <Button variant="ghost" className="justify-start gap-3 text-muted-foreground" onClick={() => logout.mutate()}>
                    <LogOut className="h-5 w-5" /> Keluar
                </Button>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
                    <div className="flex items-center gap-2">
                        <Sheet>
                            <SheetTrigger className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                                <Menu className="h-5 w-5" /><span className="sr-only">Menu</span>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-64 overflow-y-auto p-3"><div className="py-4">{Brand}</div><NavLinks role={role} /></SheetContent>
                        </Sheet>
                        <span className="font-semibold md:hidden">Panel Internal</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-medium leading-none">{name}</p>
                            <p className="text-xs text-muted-foreground">{roleLabel[role] ?? role}</p>
                        </div>
                        <Avatar className="h-9 w-9"><AvatarFallback>{name?.[0] ?? "S"}</AvatarFallback></Avatar>
                    </div>
                </header>
                <main className="flex-1 p-4 md:p-6">{children}</main>
            </div>
        </div>
    );
}

export function InternalShell({ children }: { children: React.ReactNode }) {
    return <InternalGuard><Inner>{children}</Inner></InternalGuard>;
}