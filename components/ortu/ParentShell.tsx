"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReceiptText, Activity, FileText, LogOut, Bot, Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useParent } from "@/lib/parent-store";
import { cn } from "@/lib/utils";

const nav = [
    { href: "/ortu/tagihan", label: "Tagihan", icon: ReceiptText },
    { href: "/ortu/progres", label: "Progres", icon: Activity },
    { href: "/ortu/rapot", label: "E-Rapot", icon: FileText },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    const path = usePathname();
    return (
        <nav className="space-y-1">
            {nav.map(({ href, label, icon: Icon }) => {
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

export function ParentShell({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { parent, clearParent } = useParent();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    useEffect(() => { if (mounted && !parent) router.replace("/ortu"); }, [mounted, parent, router]);
    if (!mounted || !parent) return null;

    const Brand = (
        <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></div>
            <div><p className="text-sm font-semibold">RobotiKU</p><p className="text-xs text-muted-foreground">Portal Orang Tua</p></div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-muted/30">
            <aside className="hidden w-64 shrink-0 flex-col border-r bg-background p-3 md:flex">
                <div className="py-4">{Brand}</div>
                <div className="mt-2 flex-1"><NavLinks /></div>
                <Button variant="ghost" className="justify-start gap-3 text-muted-foreground" onClick={() => { clearParent(); router.replace("/ortu"); }}>
                    <LogOut className="h-5 w-5" /> Ganti anak
                </Button>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
                    <div className="flex items-center gap-2">
                        <Sheet>
                            <SheetTrigger className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                                <Menu className="h-5 w-5" /><span className="sr-only">Menu</span>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-64 p-3"><div className="py-4">{Brand}</div><NavLinks /></SheetContent>
                        </Sheet>
                        <span className="font-semibold md:hidden">Portal Orang Tua</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-medium leading-none">{parent.name}</p>
                            <p className="text-xs text-muted-foreground">{parent.studentCode}</p>
                        </div>
                        <Avatar className="h-9 w-9"><AvatarFallback>{parent.name[0]}</AvatarFallback></Avatar>
                    </div>
                </header>
                <main className="flex-1 p-4 md:p-6">{children}</main>
            </div>
        </div>
    );
}