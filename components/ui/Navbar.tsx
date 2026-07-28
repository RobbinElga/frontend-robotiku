"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bot, ChevronDown, type LucideIcon } from "lucide-react";
import { paths } from "@/lib/paths";
import Image from "next/image";

export function Navbar() {
    const [open, setOpen] = useState<null | "masuk" | "daftar">(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const Dropdown = ({ id, label, variant }: { id: "masuk" | "daftar"; label: string; variant: string }) => {
        const items = paths.filter((p) => p.group === id);
        const isOpen = open === id;
        return (
            <div className="relative">
                <button onClick={() => setOpen(isOpen ? null : id)} aria-expanded={isOpen}
                    className={`flex items-center gap-1 rounded-full border-[3px] border-black px-5 py-2 font-display text-sm font-extrabold shadow-[3px_3px_0_0_#000] transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${variant}`}>
                    {label} <ChevronDown className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`} strokeWidth={2.5} />
                </button>
                {isOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl border-[3px] border-black bg-white p-2 shadow-[5px_5px_0_0_#000]">
                        {items.map((it) => {
                            const I: LucideIcon = it.icon;
                            return (
                                <Link key={it.href} href={it.href} className="flex items-center gap-3 rounded-lg px-3 py-2 font-display text-sm font-bold transition hover:bg-[#f6edfb]">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-black bg-primary text-white"><I className="h-4 w-4" strokeWidth={2.5} /></span>
                                    {it.title}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <nav className="mx-auto mt-5 flex max-w-6xl items-center justify-between rounded-2xl border-[3px] border-black bg-white px-5 py-3 shadow-[5px_5px_0_0_#000]">
            <Link href="/" className="flex items-center">
                <Image
                    src="/images/robotiku-logo.jpg"
                    alt="RobotiKU — Funtech Education"
                    width={200} height={64}
                    className="h-12 w-auto object-contain md:h-14"
                    priority
                />
            </Link>
            <div ref={ref} className="flex items-center gap-3">
                <Dropdown id="masuk" label="Masuk" variant="bg-white" />
                <Dropdown id="daftar" label="Daftar" variant="bg-accent" />
            </div>
        </nav>
    );
}