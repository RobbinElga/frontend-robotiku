export function AnimatedBackground() {
    return (
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <div className="anim-bg-gradient absolute inset-0" />
            <span className="aurora-blob" style={{ width: "46vw", height: "46vw", background: "#0476d9", top: "-14%", left: "-8%", animation: "drift-a 20s ease-in-out infinite" }} />
            <span className="aurora-blob" style={{ width: "40vw", height: "40vw", background: "#ffd23f", bottom: "-16%", right: "-6%", animation: "drift-b 24s ease-in-out infinite" }} />
        </div>
    );
}