"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, WMSTileLayer } from "react-leaflet";
import { GIBS_WMS, SAT_LAYERS } from "@/lib/gibs";

type Resolved = { key: string; id: string | null };

export default function SatelliteMap({ lat, lon, place }: { lat: number; lon: number; place: string }) {
  const [resolved, setResolved] = useState<Resolved[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState("ndvi");
  const [opacity, setOpacity] = useState(0.75);
  const [date, setDate] = useState("");

  useEffect(() => {
    fetch("/api/gibs")
      .then((r) => r.json())
      .then((j) => setResolved(j.layers))
      .catch(() => setFailed(true));
  }, []);

  const idFor = (key: string) => resolved?.find((r) => r.key === key)?.id ?? null;
  const def = SAT_LAYERS.find((l) => l.key === active)!;
  const layerId = idFor(active);
  // Pick the first available layer once we know which respond.
  useEffect(() => {
    if (resolved && !idFor(active)) {
      const first = SAT_LAYERS.find((l) => idFor(l.key));
      if (first) setActive(first.key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved]);

  const params: Record<string, string | boolean> = { layers: layerId ?? "", format: "image/png", transparent: true };
  if (date) params.time = date;

  return (
    <section className="card sat">
      <div className="section-head">
        <div>
          <span className="eyebrow">NASA GIBS satellite imagery</span>
          <h2>Satellite view of {place}</h2>
          <p className="muted">Live layers from NASA Earth-observing satellites around your field. Switch layers to see vegetation, soil water, rain and heat.</p>
        </div>
      </div>

      <div className="sat-tabs" role="tablist" aria-label="Satellite layers">
        {SAT_LAYERS.map((l) => {
          const ok = !!idFor(l.key);
          return (
            <button
              key={l.key} type="button" role="tab" aria-selected={active === l.key}
              className={`sat-tab ${active === l.key ? "on" : ""}`} disabled={!!resolved && !ok}
              onClick={() => setActive(l.key)} title={resolved && !ok ? "Not available from GIBS right now" : l.mission}
            >
              <b>{l.name}</b><small>{l.mission}</small>
            </button>
          );
        })}
      </div>

      <div className="sat-body">
        <div className="sat-map">
          <MapContainer center={[lat, lon]} zoom={8} style={{ height: 420, width: "100%" }} scrollWheelZoom={false}>
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" opacity={0.55} />
            {layerId && (
              <WMSTileLayer
                key={`${layerId}-${date}`}
                url={GIBS_WMS}
                params={params as never}
                opacity={opacity}
                attribution="Imagery: NASA GIBS / EOSDIS"
              />
            )}
            <CircleMarker center={[lat, lon]} radius={10} pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#f59e0b", fillOpacity: 0.9 }} />
          </MapContainer>
          {!resolved && !failed && <div className="sat-status">Checking which NASA layers are live…</div>}
          {failed && <div className="sat-status err">Could not reach NASA GIBS. Check your connection and refresh.</div>}
          {resolved && !layerId && !failed && <div className="sat-status err">This layer is not available from NASA GIBS right now.</div>}
        </div>

        <aside className="sat-side">
          <div>
            <span className="eyebrow">{def.mission} · {def.cadence}</span>
            <h3>{def.name}</h3>
            <p>{def.why}</p>
            <p className="res-note">Resolution: {def.resolution}. Each coloured square is one satellite measurement, so zooming in shows blocks, not field detail. Check your own field on the ground too.</p>
          </div>
          {def.legend.colors.length > 0 && (
            <div className="sat-legend">
              <div className="ramp" style={{ background: `linear-gradient(90deg, ${def.legend.colors.join(", ")})` }} />
              <div className="ramp-labels"><span>{def.legend.low}</span><span>{def.legend.high}</span></div>
              <small>Approximate colour key; exact scales are in NASA Worldview.</small>
            </div>
          )}
          <label className="slider">
            <span>Layer opacity<b>{Math.round(opacity * 100)}%</b></span>
            <input type="range" min={0.2} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(+e.target.value)} />
          </label>
          <label className="date-pick">
            <span>Date</span>
            <div>
              <input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
              {date && <button type="button" onClick={() => setDate("")}>Latest</button>}
            </div>
            <small>{date ? "Showing the nearest available image to this date." : "Showing the most recent image."} Try a February–April date to see dry-season bare fields.</small>
          </label>
          {layerId && <p className="sat-id">GIBS layer: <code>{layerId}</code></p>}
        </aside>
      </div>
    </section>
  );
}
