import Link from "next/link";
import { Bot, ChevronRight, HelpCircle, ArrowRight } from "lucide-react";
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

function GroupLabel({ dot, children }: { dot: string; children: React.ReactNode }) {
    return (
        <div className="mb-3 mt-7 flex items-center gap-2 font-display text-xs font-extrabold uppercase tracking-wide">
            <span className={`inline-block h-3.5 w-3.5 border-2 border-black ${dot}`} />{children}
        </div>
    );
}

export function MobileGateway() {
    const masuk = paths.filter((p) => p.group === "masuk");
    const daftar = paths.filter((p) => p.group === "daftar");

    return (
        <main className="relative min-h-screen overflow-hidden px-4 pb-28">
            <AnimatedBackground />

            {/* header */}
            <header className="mt-4 flex items-center justify-between rounded-2xl border-[3px] border-black bg-white px-4 py-3 shadow-[4px_4px_0_0_#000]">
                <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-black bg-primary text-white"><Bot className="h-5 w-5" strokeWidth={2.5} /></span>
                    <span className="font-display text-base font-extrabold tracking-tight">ROBOTIKU</span>
                </div>
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

            {/* jalur */}
            <GroupLabel dot="bg-primary">Masuk</GroupLabel>
            <div className="grid gap-4">{masuk.map((m, i) => <Row key={m.href} {...m} delay={i * 90} />)}</div>

            <GroupLabel dot="bg-accent">Daftar Siswa Baru</GroupLabel>
            <div className="grid gap-4">{daftar.map((d, i) => <Row key={d.href} {...d} delay={(i + 2) * 90} />)}</div>

            {/* statistik */}
            <div className="mt-7 grid grid-cols-3 gap-3">
                {[{ to: 500, l: "Siswa" }, { to: 20, l: "Sekolah" }, { to: 50, l: "Kelas" }].map((s) => (
                    <div key={s.l} className="rounded-xl border-[3px] border-black bg-white p-3 text-center shadow-[3px_3px_0_0_#000]">
                        <div className="font-display text-2xl font-extrabold"><CountUp to={s.to} suffix="+" /></div>
                        <div className="text-[11px] font-semibold text-ink-muted">{s.l}</div>
                    </div>
                ))}
            </div>

            {/* bottom action bar (khas mobile) */}
            <div className="fixed inset-x-0 bottom-0 z-50 flex gap-3 border-t-[3px] border-black bg-white p-3">
                <Link href="/bayar" className="flex flex-1 items-center justify-center gap-2 rounded-xl border-[3px] border-black bg-primary py-3 font-display text-sm font-extrabold text-white shadow-[3px_3px_0_0_#000] active:translate-y-[3px] active:shadow-none">Masuk</Link>
                <Link href="/daftar" className="flex flex-1 items-center justify-center gap-2 rounded-xl border-[3px] border-black bg-accent py-3 font-display text-sm font-extrabold shadow-[3px_3px_0_0_#000] active:translate-y-[3px] active:shadow-none">Daftar <ArrowRight className="h-4 w-4" strokeWidth={2.5} /></Link>
            </div>
        </main>
    );
}