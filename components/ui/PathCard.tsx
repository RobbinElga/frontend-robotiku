import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export type Path = {
    href: string;
    title: string;
    desc: string;
    icon: LucideIcon;
    primary?: boolean;
    cardBg?: string;
    iconBg?: string;
};

export function PathCard({ item, index = 0 }: { item: Path; index?: number }) {
    const Icon = item.icon;
    return (
        <Link
            href={item.href}
            style={{ animationDelay: `${index * 90}ms` }}
            className={`neo neo-press animate-pop group rounded-xl p-6 ${item.primary ? "bg-primary text-white" : item.cardBg ?? "bg-surface"}`}
        >
            <div className="flex items-start justify-between">
                <span
                    className={`neo-sm flex h-12 w-12 items-center justify-center rounded-md ${item.primary ? "bg-white text-primary" : item.iconBg ?? "bg-primary text-white"
                        }`}
                >
                    <Icon className="h-6 w-6" strokeWidth={2.5} />
                </span>
                <ArrowRight className="h-7 w-7 transition group-hover:translate-x-1" strokeWidth={2.5} />
            </div>
            <h3 className="mt-4 font-display text-xl font-extrabold">{item.title}</h3>
            <p className={`mt-1 text-sm font-medium ${item.primary ? "text-white/90" : item.cardBg ? "text-black/70" : "text-ink-muted"}`}>
                {item.desc}
            </p>
        </Link>
    );
}