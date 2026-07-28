"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocateFixed, Search, Loader2 } from "lucide-react";

const markerIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41],
});

function ClickCapture({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
    return null;
}
function Recenter({ lat, lng }: { lat: number | null; lng: number | null }) {
    const map = useMap();
    useEffect(() => { if (lat != null && lng != null) map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 0.6 }); }, [lat, lng]);
    return null;
}

export default function MapPicker({ lat, lng, radius = 500, onChange }: {
    lat: number | null; lng: number | null; radius?: number; onChange: (lat: number, lng: number) => void;
}) {
    const [q, setQ] = useState(""); const [searching, setSearching] = useState(false);
    const center: [number, number] = [lat ?? -0.0263, lng ?? 109.3425]; // default Pontianak

    const useMyLocation = () => navigator.geolocation.getCurrentPosition(
        (p) => onChange(p.coords.latitude, p.coords.longitude),
        () => alert("Gagal mengambil lokasi. Izinkan akses lokasi."),
        { enableHighAccuracy: true, timeout: 10000 }
    );

    const doSearch = async () => {
        if (!q.trim()) return;
        setSearching(true);
        try {
            const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, { headers: { "Accept-Language": "id" } });
            const d = await r.json();
            if (d?.[0]) onChange(parseFloat(d[0].lat), parseFloat(d[0].lon));
            else alert("Lokasi tidak ditemukan.");
        } catch { alert("Gagal mencari lokasi."); } finally { setSearching(false); }
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); doSearch(); } }}
                        placeholder="Cari alamat / nama tempat…" className="pl-9" />
                </div>
                <Button type="button" variant="outline" onClick={doSearch} disabled={searching}>
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cari"}
                </Button>
            </div>

            <div className="overflow-hidden rounded-xl border shadow-sm">
                <MapContainer center={center} zoom={15} style={{ height: 320, width: "100%" }} scrollWheelZoom attributionControl={false}>
                    <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" />
                    {lat != null && lng != null && (
                        <>
                            <Marker position={[lat, lng]} icon={markerIcon} />
                            <Circle center={[lat, lng]} radius={radius} pathOptions={{ color: "#0476d9", fillColor: "#0476d9", fillOpacity: 0.12 }} />
                        </>
                    )}
                    <ClickCapture onPick={onChange} />
                    <Recenter lat={lat} lng={lng} />
                </MapContainer>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{lat != null && lng != null ? `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}` : "Klik peta atau cari untuk pilih titik."}</p>
                <Button type="button" size="sm" variant="outline" onClick={useMyLocation}><LocateFixed className="mr-1.5 h-4 w-4" /> Lokasi saya</Button>
            </div>
        </div>
    );
}