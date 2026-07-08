"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft, PanelLeftClose, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, type Role, type Item } from "./nav-config";

export function Sidebar({ role }: { role: Role }) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

    // hanya menu yang boleh untuk role ini
    const groups = NAV_GROUPS
        .map((g) => ({ ...g, items: g.items.filter((it) => it.roles.includes(role)) }))
        .filter((g) => g.items.length > 0);

    // grup collapsible hanya untuk super_admin & admin; role lain tampil datar
    const grouped = role === "super_admin" || role === "admin";

    // grup yang terbuka (default: grup yang memuat halaman aktif)
    const [open, setOpen] = useState<Set<string>>(
        () => new Set(groups.filter((g) => g.label && g.items.some((it) => isActive(it.href))).map((g) => g.label!))
    );
    useEffect(() => {
        const g = NAV_GROUPS.find((g) => g.label && g.items.some((it) => it.roles.includes(role) && isActive(it.href)));
        if (g?.label) setOpen((s) => (s.has(g.label!) ? s : new Set(s).add(g.label!)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);
    const toggle = (label: string) => setOpen((s) => { const n = new Set(s); n.has(label) ? n.delete(label) : n.add(label); return n; });

    const Row = ({ it }: { it: Item }) => {
        const Icon = it.icon;
        const active = isActive(it.href);
        return (
            <Link href={it.href} title={collapsed ? it.label : undefined}
                className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted",
                    collapsed && "justify-center px-0",
                )}>
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{it.label}</span>}
            </Link>
        );
    };

    return (
        <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-background transition-[width] md:flex", collapsed ? "w-16" : "w-64")}>
            <div className="flex h-14 items-center gap-2 border-b px-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">R</div>
                {!collapsed && <span className="font-semibold">Robotiku</span>}
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-2">
                {collapsed ? (
                    // rail ikon: datar, semua item (tooltip via title)
                    groups.flatMap((g) => g.items).map((it) => <Row key={it.href} it={it} />)
                ) : (
                    groups.map((g) => {
                        // tanpa label (Dashboard) atau role non-admin → datar tanpa header
                        if (!g.label || !grouped) return <div key={g.label ?? "top"} className="space-y-1">{g.items.map((it) => <Row key={it.href} it={it} />)}</div>;

                        const isOpen = open.has(g.label);
                        return (
                            <div key={g.label} className="pt-1">
                                <button onClick={() => toggle(g.label!)}
                                    className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70 hover:bg-muted">
                                    <span>{g.label}</span>
                                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
                                </button>
                                {isOpen && <div className="mt-0.5 space-y-1">{g.items.map((it) => <Row key={it.href} it={it} />)}</div>}
                            </div>
                        );
                    })
                )}
            </nav>

            <button onClick={() => setCollapsed((c) => !c)} className="flex items-center gap-2 border-t px-4 py-3 text-xs text-muted-foreground hover:bg-muted">
                {collapsed ? <PanelLeft className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /> Ciutkan</>}
            </button>
        </aside>
    );
}