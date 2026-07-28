import { Users, School, UserPlus, GraduationCap, type LucideIcon, Wallet } from "lucide-react";

export type Path = {
    href: string; title: string; desc: string; icon: LucideIcon;
    group: "masuk" | "daftar";
    bg: string; text: string; iconBg: string; hideFromGrid?: boolean;
};

export const paths: Path[] = [
    {
        href: "/ortu", group: "masuk", title: "Orang Tua", icon: Users,
        bg: "bg-white", text: "text-ink", iconBg: "bg-primary text-white",
        desc: "Cek tagihan & progres anak tanpa kata sandi."
    },
    {
        href: "/daftar", group: "daftar", title: "Daftar Mandiri", icon: UserPlus,
        bg: "bg-primary", text: "text-white", iconBg: "bg-white text-primary",
        desc: "Daftar sendiri + bisa pakai kode promo."
    },
    {
        href: "/sekolah/login", group: "masuk", title: "Admin Sekolah", icon: School,
        bg: "bg-primary", text: "text-white", iconBg: "bg-white text-primary",
        desc: "Masuk dengan email atau nomor HP.",
        hideFromGrid: true,
    },
    {
        href: "/daftar/instansi", group: "daftar", title: "Daftar via Instansi", icon: GraduationCap,
        bg: "bg-primary", text: "text-white", iconBg: "bg-white text-primary",
        desc: "Sekolah mitra mendaftarkan muridnya."
    },
    {
        href: "/bayar", group: "masuk", title: "Bayar Tagihan", icon: Wallet,
        bg: "bg-white", text: "text-ink", iconBg: "bg-brand text-white",
        desc: "Upload bukti pembayaran tagihan anak — cepat."
    },
];