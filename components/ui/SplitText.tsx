"use client";

export function SplitText({ text, className = "" }: { text: string; className?: string }) {
    const words = text.split(" ");
    return (
        <span className={className} aria-label={text}>
            {words.map((w, i) => (
                <span key={i} className="split-word" style={{ animationDelay: `${i * 70}ms` }} aria-hidden="true">{w}&nbsp;</span>
            ))}
        </span>
    );
}