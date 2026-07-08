"use client";

import { LogOut } from "lucide-react";
import { NotifBell } from "./NotifBell";
import { ROLE_LABEL, type Role } from "./nav-config";

export function Topbar({ name, role, onLogout }: { name: string; role: Role; onLogout: () => void }) {
    return (
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur">
            <div className="flex items-center gap-2 md:hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">R</div>
                <span className="font-semibold">Robotiku</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
                <NotifBell />
                <div className="hidden text-right sm:block">
                    <div className="text-sm font-medium leading-tight">{name}</div>
                    <div className="text-xs text-muted-foreground">{ROLE_LABEL[role]}</div>
                </div>
                <button onClick={onLogout} title="Keluar" className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-red-600">
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </header>
    );
}