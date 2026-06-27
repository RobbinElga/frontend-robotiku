import Link from "next/link";
import { Bot, ArrowRight } from "lucide-react";
import { paths } from "@/lib/paths";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { SplitText } from "@/components/ui/SplitText";
import { CircularText } from "@/components/ui/CircularText";
import { Navbar } from "@/components/ui/Navbar";
import { Tilt } from "@/components/ui/Tilt";
import { CountUp } from "@/components/ui/CountUp";

export function DesktopGateway() {
    return (
        <main className="relative min-h-screen overflow-hidden px-4 pb-12">
            <AnimatedBackground />
            <Navbar />

            <section className="mx-auto mt-6 max-w-6xl">
                <div className="relative overflow-hidden rounded-[28px] border-[3px] border-black p-7 shadow-[6px_6px_0_0_#000] md:p-12"
                    style={{ background: "radial-gradient(120% 120% at 80% 10%, #f3dcfa, #fff6e6 70%)" }}>
                    <div className="grid gap-10 md:grid-cols-2 md:items-center">
                        <div>
                            <span className="animate-wiggle neo-sm inline-block rounded-md bg-primary px-3 py-1 font-display text-xs font-extrabold uppercase tracking-wide text-white">
                                Portal Manajemen
                            </span>
                            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[0.92] tracking-tight md:text-6xl">
                                <SplitText text="Pantau & kelola robotik anak Anda." />
                            </h1>
                            <p className="mt-5 max-w-md text-base font-medium text-ink-muted">
                                Satu pintu untuk orang tua & sekolah mitra — cek tagihan, kehadiran, dan rapor anak dengan mudah.
                            </p>
                            <Link href="/bayar" className="mt-7 inline-flex items-center gap-2 rounded-full border-[3px] border-black bg-primary px-6 py-3 font-display text-sm font-extrabold text-white shadow-[4px_4px_0_0_#000] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                                Masuk sebagai Orang Tua <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                            </Link>
                        </div>
                        <div className="relative">
                            <div className="aspect-square w-full" style={{
                                backgroundImage: "url('/images/hero-anak.jpg')", backgroundSize: "cover", backgroundPosition: "center",
                                backgroundColor: "#0476d9",
                                clipPath: "polygon(25% 0%, 75% 0%, 100% 28%, 100% 72%, 75% 100%, 25% 100%, 0% 72%, 0% 28%)",
                                filter: "drop-shadow(6px 6px 0 #000)",
                            }} />
                            <div className="absolute -left-4 bottom-6 md:-left-8"><CircularText /></div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto mt-6 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-4">
                {paths.map((c, i) => {
                    const Icon = c.icon;
                    return (
                        <Tilt key={c.href} className="h-full">
                            <Link href={c.href} style={{ animationDelay: `${i * 90}ms` }}
                                className={`animate-pop group flex h-full flex-col rounded-2xl border-[3px] border-black p-6 shadow-[5px_5px_0_0_#000] transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${c.bg} ${c.text}`}>
                                <span className={`flex h-11 w-11 items-center justify-center rounded-md border-2 border-black shadow-[2px_2px_0_0_#000] ${c.iconBg}`}><Icon className="h-6 w-6" strokeWidth={2.5} /></span>
                                <h3 className="mt-4 font-display text-xl font-extrabold">{c.title}</h3>
                                <p className={`mt-1 flex-1 text-sm font-medium ${c.text === "text-white" ? "text-white/90" : "text-black/70"}`}>{c.desc}</p>
                                <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border-2 border-black bg-black px-4 py-2 font-display text-xs font-extrabold text-white">
                                    {c.group === "masuk" ? "Masuk" : "Daftar"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" strokeWidth={2.5} />
                                </span>
                            </Link>
                        </Tilt>
                    );
                })}
            </section>

            <section className="mx-auto mt-6 grid max-w-6xl gap-5 sm:grid-cols-3">
                {[
                    { to: 500, suffix: "+", label: "Siswa Aktif", dot: "bg-primary" },
                    { to: 20, suffix: "+", label: "Sekolah Mitra", dot: "bg-accent" },
                    { to: 50, suffix: "+", label: "Kelas Tersedia", dot: "bg-primary" },
                ].map((s) => (
                    <div key={s.label} className="rounded-2xl border-[3px] border-black bg-white p-6 shadow-[5px_5px_0_0_#000]">
                        <span className={`mb-3 inline-block h-3 w-3 border-2 border-black ${s.dot}`} />
                        <div className="font-display text-4xl font-extrabold"><CountUp to={s.to} suffix={s.suffix} /></div>
                        <div className="mt-1 text-sm font-semibold text-ink-muted">{s.label}</div>
                    </div>
                ))}
            </section>

            <footer className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-3 text-sm font-medium text-ink-muted md:flex-row">
                <div className="flex gap-5">
                    <a href="https://robotiku.id" className="hover:underline">Kunjungi robotiku.id</a>
                    <a href="https://wa.me/6281234567890" className="hover:underline">Bantuan via WhatsApp</a>
                </div>
                <span>© 2026 Yayasan Tadika Cikal Mulia</span>
            </footer>
        </main>
    );
}