"use client";

import { useIsMobile } from "@/lib/useIsMobile";
import { DesktopGateway } from "@/components/gateway/DesktopGateway";
import { MobileGateway } from "@/components/gateway/MobileGateway";

export default function GatewayPage() {
    const isMobile = useIsMobile();

    // hindari mismatch SSR: render setelah tahu lebar layar
    if (isMobile === undefined) {
        return <div className="min-h-screen" />;
    }

    return isMobile ? <MobileGateway /> : <DesktopGateway />;
}