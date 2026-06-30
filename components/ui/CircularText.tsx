"use client";

import { ArrowRight } from "lucide-react";

export function CircularText({ text = "MULAI•SEKARANG•ROBOTIKU•", size = 132 }: { text?: string; size?: number }) {
    const chars = [...text];
    const deg = 360 / chars.length;
    const radius = size / 2 - 14;

    return (
        <div className="animate-bob relative grid place-items-center rounded-full border-[3px] border-black bg-brand-accent" style={{ width: size, height: size, boxShadow: "5px 5px 0 0 #000" }} aria-hidden="true">
            <div className="spin-slow absolute inset-0">
                {chars.map((c, i) => (
                    <span key={i} className="absolute left-1/2 top-1/2 font-display text-[11px] font-extrabold uppercase" style={{ transform: `translate(-50%,-50%) rotate(${i * deg}deg) translateY(-${radius}px)` }}>{c}</span>
                ))}
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-black bg-black text-white"><ArrowRight className="h-4 w-4" strokeWidth={3} /></span>
        </div>
    );
}