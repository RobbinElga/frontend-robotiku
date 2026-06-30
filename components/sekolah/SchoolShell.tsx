"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { LayoutDashboard, Users, Wallet, History, LogOut, Bot, Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { SchoolGuard } from "@/components/auth/SchoolGuard";
import { cn } from "@/lib/utils";

const nav = [
    { href: "/sekolah/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/sekolah/siswa", label: "Siswa", icon: Users },
    { href: "/sekolah/pembayaran", label: "Pembayaran Kolektif", icon: Wallet },
    { href: "/sekolah/riwayat", label: "Riwayat", icon: History },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    const path = usePathname();
    return (
        <nav className="space-y-1">
            {nav.map(({ href, label, icon: Icon }) => {
                const active = path === href;
                return (
                    <Link key={href} href={href} onClick={onNavigate}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}>
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
    const logout = useMutation({
        mutationFn: async () => api.post("/auth/school-admin/logout"),
        onSettled: () => { clear(); router.replace("/sekolah/login"); },
    });

    const Brand = (
        <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></div>
            <div><p className="text-sm font-semibold">RobotiKU</p><p className="text-xs text-muted-foreground">Portal Sekolah</p></div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-muted/30">
            {/* sidebar desktop */}
            <aside className="hidden w-64 shrink-0 flex-col border-r bg-background p-3 md:flex">
                <div className="py-4">{Brand}</div>
                <div className="mt-2 flex-1"><NavLinks /></div>
                <Button variant="ghost" className="justify-start gap-3 text-muted-foreground" onClick={() => logout.mutate()}>
                    <LogOut className="h-5 w-5" /> Keluar
                </Button>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                {/* topbar */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
                    <div className="flex items-center gap-2">
                        <Sheet>
                            <SheetTrigger className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Buka menu</span>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-64 p-3">
                                <div className="py-4">{Brand}</div>
                                <NavLinks />
                            </SheetContent>
                        </Sheet>
                        <span className="font-semibold md:hidden">Portal Sekolah</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-medium leading-none">{actor?.kind === "school_admin" ? actor.name : "Admin Sekolah"}</p>
                            <p className="text-xs text-muted-foreground">Admin Sekolah</p>
                        </div>
                        <Avatar className="h-9 w-9"><AvatarFallback>{actor?.kind === "school_admin" ? actor.name?.[0] : "A"}</AvatarFallback></Avatar>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6">{children}</main>
            </div>
        </div>
    );
}

export function SchoolShell({ children }: { children: React.ReactNode }) {
    return <SchoolGuard><Inner>{children}</Inner></SchoolGuard>;
}