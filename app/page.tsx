"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function Home() {
  const [status, setStatus] = useState("loading...");
  useEffect(() => {
    api.get("/health")
      .then((res) => setStatus(JSON.stringify(res.data)))
      .catch((err) => setStatus("ERROR: " + err.message));
  }, []);
  return (
    <main className="min-h-screen grid place-items-center bg-surface">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold text-brand-orange">RobotiKU 🚀</h1>
        <p className="mt-3 text-ink-soft">API: {status}</p>
      </div>
    </main>
  );
}