"use client";

import { InternalShell } from "@/components/internal/InternalShell";
import { KeuanganDashboard } from "@/components/dashboard/KeuanganDashboard";

export default function Page() {
    return (
        <InternalShell>
            <KeuanganDashboard />
        </InternalShell>
    );
}
