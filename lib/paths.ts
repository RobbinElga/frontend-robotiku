import { Users, School, UserPlus, GraduationCap, type LucideIcon } from "lucide-react";

export type Path = {
    href: string; title: string; desc: string; icon: LucideIcon;
    group: "masuk" | "daftar";
    bg: string; text: string; iconBg: string;
};

export const paths: Path[] = [
    {
        href: "/bayar", group: "masuk", title: "Orang Tua", icon: Users,
        bg: "bg-primary", text: "text-white", iconBg: "bg-white text-primary",
        desc: "Cek tagihan & progres anak tanpa kata sandi."
    },
    {
        href: "/sekolah/login", group: "masuk", title: "Admin Sekolah", icon: School,
        bg: "bg-accent", text: "text-ink", iconBg: "bg-black text-white",
        desc: "Masuk dengan email atau nomor HP."
    },
    {
        href: "/daftar", group: "daftar", title: "Daftar Mandiri", icon: UserPlus,
        bg: "bg-white", text: "text-ink", iconBg: "bg-primary text-white",
        desc: "Daftar sendiri + bisa pakai kode promo."
    },
    {
        href: "/daftar/instansi", group: "daftar", title: "Daftar via Instansi", icon: GraduationCap,
        bg: "bg-white", text: "text-ink", iconBg: "bg-accent text-ink",
        desc: "Sekolah mitra mendaftarkan muridnya."
    },
];