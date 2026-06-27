"use client";

import { useEffect, useRef, useState } from "react";

export function CountUp({ to, suffix = "", duration = 1200 }: { to: number; suffix?: string; duration?: number }) {
    const [n, setN] = useState(0);
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;
        const t0 = performance.now();
        const tick = (t: number) => {
            const p = Math.min((t - t0) / duration, 1);
            setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [to, duration]);

    return <>{n.toLocaleString("id-ID")}{suffix}</>;
}