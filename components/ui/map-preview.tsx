"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41],
});

export default function MapPreview({ lat, lng, height = 150 }: { lat: number; lng: number; height?: number }) {
    return (
        <div className="overflow-hidden rounded-lg border">
            <MapContainer center={[lat, lng]} zoom={16} style={{ height, width: "100%" }}
                dragging={false} zoomControl={false} scrollWheelZoom={false} doubleClickZoom={false} attributionControl={false} touchZoom={false} keyboard={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[lat, lng]} icon={icon} />
            </MapContainer>
        </div>
    );
}