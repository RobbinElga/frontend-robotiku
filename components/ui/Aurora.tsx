export function Aurora() {
    return (
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <span className="aurora-blob" style={{ width: "46vw", height: "46vw", background: "#f26522", top: "-12%", left: "-8%", animation: "drift-a 18s ease-in-out infinite" }} />
            <span className="aurora-blob" style={{ width: "40vw", height: "40vw", background: "#0476D9", bottom: "-18%", right: "-6%", animation: "drift-b 22s ease-in-out infinite" }} />
            <span className="aurora-blob" style={{ width: "38vw", height: "38vw", background: "#8cc63f", top: "35%", left: "42%", animation: "drift-c 20s ease-in-out infinite" }} />
        </div>
    );
}