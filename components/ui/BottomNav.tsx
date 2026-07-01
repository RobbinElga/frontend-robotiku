"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, type LucideIcon } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export function BottomNav({ items }: { items: NavItem[] }) {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

    const primary = items.length > 5 ? items.slice(0, 4) : items;
    const overflow = items.length > 5 ? items.slice(4) : [];

    return (
        <>
            <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background md:hidden">
                {primary.map((it) => {
                    const Icon = it.icon;
                    const active = isActive(it.href);
                    return (
                        <Link key={it.href} href={it.href}
                            className={cn("flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors",
                                active ? "text-primary" : "text-muted-foreground")}>
                            <Icon className={cn("h-5 w-5", active && "fill-primary/10")} />
                            <span className="max-w-full truncate px-1">{it.label}</span>
                        </Link>
                    );
                })}
                {overflow.length > 0 && (
                    <button onClick={() => setMenuOpen(true)}
                        className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground">
                        <Menu className="h-5 w-5" />
                        <span>Menu</span>
                    </button>
                )}
            </nav>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetContent side="bottom" className="rounded-t-2xl p-4">
                    <div className="grid grid-cols-4 gap-3 pb-2">
                        {overflow.map((it) => {
                            const Icon = it.icon;
                            return (
                                <Link key={it.href} href={it.href} onClick={() => setMenuOpen(false)}
                                    className={cn("flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors",
                                        isActive(it.href) ? "border-primary/40 bg-primary/5 text-primary" : "text-muted-foreground")}>
                                    <Icon className="h-5 w-5" />
                                    <span className="text-center leading-tight">{it.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}