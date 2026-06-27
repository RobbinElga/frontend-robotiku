"use client";

import { useRef, type ReactNode } from "react";

export function Tilt({ children, className = "" }: { children: ReactNode; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);

    const onMove = (e: React.MouseEvent) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(700px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 7).toFixed(2)}deg)`;
    };
    const onLeave = () => {
        if (ref.current) ref.current.style.transform = "perspective(700px) rotateX(0deg) rotateY(0deg)";
    };

    return (
        <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={className} style={{ transition: "transform .15s ease" }}>
            {children}
        </div>
    );
}