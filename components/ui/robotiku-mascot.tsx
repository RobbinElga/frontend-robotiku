"use client";

import { useState } from "react";

const css = `
.rkm-floaty{animation:rkm-float 3.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.rkm-inner{transform-box:fill-box;transform-origin:center}
.rkm-antenna{transform-box:fill-box;transform-origin:50% 100%;animation:rkm-sway 2.2s ease-in-out infinite}
.rkm-eyes{transform-box:fill-box;transform-origin:center;animation:rkm-blink 4.5s infinite}
.rkm-spin{transform-box:fill-box;transform-origin:center;animation:rkm-spin 9s linear infinite}
.rkm-glow{transform-box:fill-box;transform-origin:center;animation:rkm-glowp 3.2s ease-in-out infinite}
.rkm-smile{opacity:0;transition:opacity .25s}
.rkm-arm-l{transform-box:fill-box;transform-origin:100% 50%}
.rkm-arm-r{transform-box:fill-box;transform-origin:0% 50%}
.rkm-spark{opacity:0;transform-box:fill-box;transform-origin:center}
.rkm-robot:hover .rkm-floaty{animation-duration:1.5s}
.rkm-robot:hover .rkm-arm-r{animation:rkm-wave .5s ease-in-out infinite}
.rkm-robot:hover .rkm-arm-l{animation:rkm-wave .6s ease-in-out infinite reverse}
.rkm-robot:hover .rkm-smile{opacity:1}
.rkm-robot:hover .rkm-eyes{animation:none;transform:scale(1.12)}
.rkm-robot:hover .rkm-spark{opacity:1;animation:rkm-pop 1.1s ease-in-out infinite}
.rkm-inner.rkm-jump{animation:rkm-jump .8s cubic-bezier(.34,1.56,.64,1)}
@keyframes rkm-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes rkm-sway{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
@keyframes rkm-blink{0%,90%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
@keyframes rkm-spin{to{transform:rotate(360deg)}}
@keyframes rkm-glowp{0%,100%{opacity:.45}50%{opacity:.85}}
@keyframes rkm-wave{0%,100%{transform:rotate(0)}50%{transform:rotate(-28deg)}}
@keyframes rkm-jump{0%{transform:translateY(0) rotate(0)}25%{transform:translateY(-30px) rotate(0)}55%{transform:translateY(-6px) rotate(360deg)}100%{transform:translateY(0) rotate(360deg)}}
@keyframes rkm-pop{0%,100%{transform:scale(.6);opacity:.5}50%{transform:scale(1.1);opacity:1}}
@media (prefers-reduced-motion:reduce){.rkm-floaty,.rkm-antenna,.rkm-eyes,.rkm-spin,.rkm-glow,.rkm-spark{animation:none!important}}
`;

export function RobotikuMascot({ size = 500, className = "" }: { size?: number; className?: string }) {
    const [jump, setJump] = useState(false);

    return (
        <div className={`rkm-robot ${className}`} style={{ cursor: "pointer", lineHeight: 0 }} onClick={() => setJump(true)}>
            <style>{css}</style>
            <svg width={size} height={size} viewBox="0 0 260 260" role="img" aria-label="Maskot RobotiKU" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="rkm-og" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF9A4D" /><stop offset="1" stopColor="#F0531C" /></linearGradient>
                    <linearGradient id="rkm-ob" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF8A3D" /><stop offset="1" stopColor="#E8481A" /></linearGradient>
                    <radialGradient id="rkm-glowg"><stop offset="0" stopColor="#FF8A3D" stopOpacity="0.45" /><stop offset="1" stopColor="#FF8A3D" stopOpacity="0" /></radialGradient>
                </defs>

                <circle className="rkm-glow" cx="130" cy="152" r="96" fill="url(#rkm-glowg)" />

                <g className="rkm-floaty">
                    <g className={`rkm-inner ${jump ? "rkm-jump" : ""}`} onAnimationEnd={() => setJump(false)}>
                        {/* antena */}
                        <g className="rkm-antenna">
                            <path d="M120 98 C 115 86 129 84 121 74 C 116 67 125 62 118 56" fill="none" stroke="#7A2E8E" strokeWidth={4} strokeLinecap="round" />
                            <circle cx="117" cy="52" r="6" fill="#7A2E8E" />
                        </g>
                        {/* telinga */}
                        <rect x="72" y="114" width="16" height="34" rx="8" fill="#8CC63F" />
                        <rect x="172" y="114" width="16" height="34" rx="8" fill="#8CC63F" />
                        {/* kepala */}
                        <rect x="84" y="94" width="92" height="76" rx="24" fill="url(#rkm-og)" />
                        <rect x="84" y="94" width="92" height="76" rx="24" fill="none" stroke="#D94E17" strokeWidth={3} />
                        <rect x="97" y="107" width="66" height="50" rx="17" fill="#FFF6EA" />
                        {/* mata */}
                        <g className="rkm-eyes">
                            <ellipse cx="118" cy="130" rx="6.5" ry="9" fill="#3F2A66" />
                            <ellipse cx="142" cy="130" rx="6.5" ry="9" fill="#3F2A66" />
                            <circle cx="120" cy="127" r="2" fill="#fff" />
                            <circle cx="144" cy="127" r="2" fill="#fff" />
                        </g>
                        {/* senyum (muncul saat hover) */}
                        <path className="rkm-smile" d="M119 143 Q130 151 141 143" fill="none" stroke="#3F2A66" strokeWidth={3} strokeLinecap="round" />
                        {/* leher */}
                        <rect x="122" y="166" width="16" height="10" fill="#D94E17" />
                        {/* lengan */}
                        <g className="rkm-arm-l"><rect x="74" y="192" width="20" height="12" rx="6" fill="#8CC63F" /></g>
                        <g className="rkm-arm-r"><rect x="166" y="192" width="22" height="12" rx="6" fill="#8CC63F" /></g>
                        {/* badan */}
                        <rect x="92" y="176" width="76" height="66" rx="26" fill="url(#rkm-ob)" />
                        <rect x="92" y="176" width="76" height="66" rx="26" fill="none" stroke="#D94E17" strokeWidth={3} />
                        {/* emblem */}
                        <circle cx="130" cy="206" r="19" fill="#FFF6EA" />
                        <circle cx="130" cy="206" r="19" fill="none" stroke="#8CC63F" strokeWidth={4} />
                        <g className="rkm-spin"><path d="M130 196 l8.7 5 v10 l-8.7 5 -8.7 -5 v-10 z" fill="#8CC63F" /></g>
                        {/* kaki */}
                        <ellipse cx="114" cy="245" rx="12" ry="6" fill="#D94E17" />
                        <ellipse cx="146" cy="245" rx="12" ry="6" fill="#D94E17" />
                        {/* kilau (muncul saat hover) */}
                        <g className="rkm-spark" style={{ animationDelay: "0s" }}><path transform="translate(64 96)" d="M0 -7 L1.7 -1.7 7 0 1.7 1.7 0 7 -1.7 1.7 -7 0 -1.7 -1.7 z" fill="#FFD23F" /></g>
                        <g className="rkm-spark" style={{ animationDelay: ".25s" }}><path transform="translate(198 118)" d="M0 -6 L1.4 -1.4 6 0 1.4 1.4 0 6 -1.4 1.4 -6 0 -1.4 -1.4 z" fill="#8CC63F" /></g>
                        <g className="rkm-spark" style={{ animationDelay: ".5s" }}><path transform="translate(190 214)" d="M0 -6 L1.4 -1.4 6 0 1.4 1.4 0 6 -1.4 1.4 -6 0 -1.4 -1.4 z" fill="#7A2E8E" /></g>
                    </g>
                </g>
            </svg>
        </div>
    );
}