"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, HelpCircle, ArrowRight, X } from "lucide-react";
import { paths } from "@/lib/paths";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { SplitText } from "@/components/ui/SplitText";
import { CircularText } from "@/components/ui/CircularText";
import { CountUp } from "@/components/ui/CountUp";

function Row({ href, title, desc, icon: Icon, iconBg, delay }: any) {
    return (
        <Link href={href} style={{ animationDelay: `${delay}ms` }}
            className="animate-pop flex items-center gap-3 rounded-2xl border-[3px] border-black bg-white p-4 shadow-[4px_4px_0_0_#000] transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 border-black shadow-[2px_2px_0_0_#000] ${iconBg}`}><Icon className="h-6 w-6" strokeWidth={2.5} /></span>
            <span className="min-w-0 flex-1">
                <span className="block font-display text-base font-extrabold">{title}</span>
                <span className="block truncate text-xs font-medium text-ink-muted">{desc}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0" strokeWidth={2.5} />
        </Link>
    );
}

function SheetRow({ href, title, desc, icon: Icon, iconBg, onClick }: any) {
    return (
        <Link href={href} onClick={onClick}
            className="flex items-center gap-3 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0_0_#000] transition active:translate-y-[2px] active:shadow-none">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-black ${iconBg}`}><Icon className="h-5 w-5" strokeWidth={2.5} /></span>
            <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-extrabold">{title}</span>
                <span className="block truncate text-[11px] font-medium text-ink-muted">{desc}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0" strokeWidth={2.5} />
        </Link>
    );
}

function GroupLabel({ dot, children }: { dot: string; children: React.ReactNode }) {
    return (
        <div className="mb-3 mt-7 flex items-center gap-2 font-display text-xs font-extrabold uppercase tracking-wide">
            <span className={`inline-block h-3.5 w-3.5 border-2 border-black ${dot}`} />{children}
        </div>
    );
}

export function MobileGateway() {
    const [menu, setMenu] = useState<null | "masuk" | "daftar">(null);
    const close = () => setMenu(null);

    // kartu di halaman: Admin Sekolah (hideFromGrid) disembunyikan
    const masukCards = paths.filter((p) => p.group === "masuk" && !p.hideFromGrid);
    const daftarCards = paths.filter((p) => p.group === "daftar");

    // menu bottom sheet: lengkap (Admin Sekolah ikut di menu Masuk)
    const masukMenu = paths.filter((p) => p.group === "masuk");
    const daftarMenu = paths.filter((p) => p.group === "daftar");

    const sheetItems = menu === "masuk" ? masukMenu : daftarMenu;
    const sheetTitle = menu === "masuk" ? "Masuk sebagai" : "Daftar sebagai";

    return (
        <main className="relative min-h-screen overflow-x-hidden px-4 pb-36">
            <AnimatedBackground />

            {/* header — logo JPG */}
            <header className="mt-4 flex items-center justify-between rounded-2xl border-[3px] border-black bg-white px-4 py-3 shadow-[4px_4px_0_0_#000]">
                <Link href="/" className="flex items-center">
                    <Image src="/images/robotiku-logo.jpg" alt="RobotiKU" width={150} height={44} className="h-10 w-auto object-contain" priority />
                </Link>
                <a href="https://wa.me/6281234567890" aria-label="Bantuan" className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-black bg-accent shadow-[2px_2px_0_0_#000]"><HelpCircle className="h-5 w-5" strokeWidth={2.5} /></a>
            </header>

            {/* hero */}
            <section className="mt-5 overflow-hidden rounded-3xl border-[3px] border-black p-6 shadow-[5px_5px_0_0_#000]" style={{ background: "radial-gradient(120% 120% at 80% 10%, #f3dcfa, #fff6e6 75%)" }}>
                <span className="animate-wiggle inline-block rounded-md border-2 border-black bg-primary px-3 py-1 font-display text-[11px] font-extrabold uppercase tracking-wide text-white shadow-[2px_2px_0_0_#000]">Portal Manajemen</span>
                <h1 className="mt-4 font-display text-4xl font-extrabold leading-[0.95] tracking-tight">
                    <SplitText text="Kelola robotik anak Anda." />
                </h1>
                <p className="mt-3 text-sm font-medium text-ink-muted">Cek tagihan, kehadiran, dan rapor anak dengan mudah.</p>
                <div className="mt-5 flex justify-center"><CircularText size={108} /></div>
            </section>

            {/* jalur — grid-cols-1 mencegah kartu kepotong */}
            <GroupLabel dot="bg-primary">Masuk</GroupLabel>
            <div className="grid grid-cols-1 gap-4">{masukCards.map((m, i) => <Row key={m.href} {...m} delay={i * 90} />)}</div>

            <GroupLabel dot="bg-accent">Daftar Siswa Baru</GroupLabel>
            <div className="grid grid-cols-1 gap-4">{daftarCards.map((d, i) => <Row key={d.href} {...d} delay={(i + 2) * 90} />)}</div>

            {/* statistik */}
            <div className="mt-7 grid grid-cols-3 gap-3">
                {[{ to: 500, l: "Siswa" }, { to: 20, l: "Sekolah" }, { to: 50, l: "Kelas" }].map((s) => (
                    <div key={s.l} className="rounded-xl border-[3px] border-black bg-white p-3 text-center shadow-[3px_3px_0_0_#000]">
                        <div className="font-display text-2xl font-extrabold"><CountUp to={s.to} suffix="+" /></div>
                        <div className="text-[11px] font-semibold text-ink-muted">{s.l}</div>
                    </div>
                ))}
            </div>

            {/* bottom action bar — tombol membuka menu */}
            <div className="fixed inset-x-0 bottom-0 z-50 flex gap-3 border-t-[3px] border-black bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                <button onClick={() => setMenu("masuk")} className="flex flex-1 items-center justify-center gap-2 rounded-xl border-[3px] border-black bg-primary py-3 font-display text-sm font-extrabold text-white shadow-[3px_3px_0_0_#000] active:translate-y-[3px] active:shadow-none">Masuk</button>
                <button onClick={() => setMenu("daftar")} className="flex flex-1 items-center justify-center gap-2 rounded-xl border-[3px] border-black bg-accent py-3 font-display text-sm font-extrabold shadow-[3px_3px_0_0_#000] active:translate-y-[3px] active:shadow-none">Daftar <ArrowRight className="h-4 w-4" strokeWidth={2.5} /></button>
            </div>

            {/* bottom sheet menu */}
            {menu && (
                <div className="fixed inset-0 z-[60]">
                    <div className="animate-fadeIn absolute inset-0 bg-black/45" onClick={close} />
                    <div className="animate-slideUp absolute inset-x-0 bottom-0 rounded-t-3xl border-t-[3px] border-black bg-white p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-4px_0_0_#000]">
                        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-black/20" />
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="font-display text-lg font-extrabold">{sheetTitle}</h3>
                            <button onClick={close} aria-label="Tutup" className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-black active:translate-y-[2px]"><X className="h-4 w-4" strokeWidth={2.5} /></button>
                        </div>
                        <div className="grid gap-3">
                            {sheetItems.map((o) => <SheetRow key={o.href} {...o} onClick={close} />)}
                        </div>
                    </div>
                    <style>{`
                        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
                        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
                        .animate-slideUp{animation:slideUp .28s cubic-bezier(.22,1,.36,1)}
                        .animate-fadeIn{animation:fadeIn .2s ease}
                    `}</style>
                </div>
            )}
        </main>
    );
}