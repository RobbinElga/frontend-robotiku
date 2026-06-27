import { Bot, Star } from "lucide-react";

export function Marquee({
    items,
    reverse = false,
    bg = "bg-secondary",
    text = "text-white",
}: {
    items: string[];
    reverse?: boolean;
    bg?: string;
    text?: string;
}) {
    const loop = [...items, ...items]; // duplikat untuk loop mulus

    return (
        <div className={`overflow-hidden border-y-[3px] border-black ${bg} ${text}`} aria-hidden="true">
            <div className={`marquee-track ${reverse ? "marquee-reverse" : ""} flex w-max items-center gap-8 py-2.5 will-change-transform`}>
                {loop.map((t, i) => (
                    <span key={i} className="flex items-center gap-8 font-display text-sm font-extrabold uppercase tracking-wide">
                        {t}
                        {i % 2 === 0 ? <Star className="h-4 w-4" strokeWidth={2.5} /> : <Bot className="h-4 w-4" strokeWidth={2.5} />}
                    </span>
                ))}
            </div>
        </div>
    );
}