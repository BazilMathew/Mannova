"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from "react-leaflet";

function ClickHandler({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Recenter({ lat, lon, zoom }: { lat: number; lon: number; zoom?: number }) {
  const map = useMap();
  // Pan only if the point has left the visible area (so clicking doesn't reset the user's zoom).
  useEffect(() => {
    if (!map.getBounds().contains([lat, lon])) map.setView([lat, lon]);
  }, [lat, lon, map]);
  useEffect(() => {
    if (zoom) map.setView([lat, lon], zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, map]);
  return null;
}

export default function FieldMap({ lat, lon, zoom, onPick }: { lat: number; lon: number; zoom?: number; onPick: (lat: number, lon: number) => void }) {
  return (
    <MapContainer center={[lat, lon]} zoom={zoom ?? 7} style={{ height: 220, width: "100%" }}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <CircleMarker center={[lat, lon]} radius={9} pathOptions={{ color: "#1f7a4d", fillOpacity: 0.6 }} />
      <ClickHandler onPick={onPick} />
      <Recenter lat={lat} lon={lon} zoom={zoom} />
    </MapContainer>
  );
}
