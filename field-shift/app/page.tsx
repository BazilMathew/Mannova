"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { applyScenario, type ClimateProfile } from "@/lib/climate";
import { CROPS } from "@/lib/crops";
import { exploreRotations, SEASONS, type FarmInputs } from "@/lib/rotation";
import { REGIONS, inKerala } from "@/lib/regions";
import ClimateCharts from "@/components/ClimateCharts";
import ClimateSnapshot from "@/components/ClimateSnapshot";
import StrategyGrid from "@/components/StrategyGrid";
import StrategyDetail from "@/components/StrategyDetail";
import Glossary from "@/components/Glossary";

const FieldMap = dynamic(() => import("@/components/FieldMap"), { ssr: false, loading: () => <div className="mapph">Loading map…</div> });

const START = REGIONS[0];
const PRIORITIES = [
  ["water", "Saving water", "💧"],
  ["soil", "Soil health", "🌱"],
  ["income", "Income", "₹"],
  ["risk", "Avoiding climate risk", "🛡"],
] as const;

function Step({ n, title, children, hint }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="step">
      <div className="step-head"><span className="step-n">{n}</span><h3>{title}</h3></div>
      {hint && <p className="hint">{hint}</p>}
      {children}
    </div>
  );
}

export default function Home() {
  const [regionId, setRegionId] = useState<string>(START.id);
  const [zoom, setZoom] = useState<number>(7);
  const [lat, setLat] = useState(START.lat);
  const [lon, setLon] = useState(START.lon);
  const [inputs, setInputs] = useState<FarmInputs>({ ...START.defaults, priorities: { water: 6, soil: 7, income: 6, risk: 7 } });
  const [climate, setClimate] = useState<ClimateProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rainPct, setRainPct] = useState(0);
  const [tDelta, setTDelta] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const region = REGIONS.find((r) => r.id === regionId);

  function chooseRegion(id: string) {
    setRegionId(id);
    const r = REGIONS.find((x) => x.id === id);
    if (!r) return;
    setLat(r.lat);
    setLon(r.lon);
    setZoom(9);
    setInputs((p) => ({ ...p, ...r.defaults, current: [...r.defaults.current] as FarmInputs["current"] }));
    setClimate(null);
  }

  const results = useMemo(
    () => (climate ? exploreRotations(applyScenario(climate, rainPct, tDelta), inputs) : null),
    [climate, inputs, rainPct, tDelta],
  );
  const items = results ? [results.current, ...results.options] : [];
  const keyOf = (i: number) => (i === 0 ? "current" : items[i].key);
  const selIdx = Math.max(0, items.findIndex((_, i) => keyOf(i) === selected));
  useEffect(() => {
    if (results && !items.some((_, i) => keyOf(i) === selected)) setSelected(items.length > 1 ? keyOf(1) : "current");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  const scenarioNote = rainPct !== 0 || tDelta !== 0 ? `${rainPct > 0 ? "+" : ""}${rainPct}% rain, +${tDelta} °C` : null;
  const place = region ? `${region.name}, ${region.district}` : "Custom location";

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/climate?lat=${lat}&lon=${lon}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setClimate(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const set = <K extends keyof FarmInputs>(k: K, v: FarmInputs[K]) => setInputs((p) => ({ ...p, [k]: v }));
  const setPriority = (k: keyof FarmInputs["priorities"], v: number) => setInputs((p) => ({ ...p, priorities: { ...p.priorities, [k]: v } }));
  const toggleExclude = (id: string) =>
    setInputs((p) => {
      const ex = new Set(p.exclude ?? []);
      if (ex.has(id)) ex.delete(id); else ex.add(id);
      return { ...p, exclude: [...ex] };
    });

  return (
    <>
      <header className="hero">
        <div className="hero-inner">
          <div className="brand">
            <span className="logo" aria-hidden>
              <svg viewBox="0 0 120 120" width="46" height="46" aria-hidden="true"><defs><clipPath id="cbhdr"><circle cx="60" cy="60" r="52"></circle></clipPath></defs><circle cx="60" cy="60" r="52" fill="#0b3324"></circle><g clipPath="url(#cbhdr)"><path d="M0 70 Q30 60 60 70 T120 70 V120 H0 Z" fill="#a16207"></path><path d="M0 84 Q30 75 60 84 T120 84 V120 H0 Z" fill="#7c4a2d"></path><path d="M0 98 Q30 90 60 98 T120 98 V120 H0 Z" fill="#4a2c1a"></path><path d="M0 70 Q30 60 60 70 T120 70" fill="none" stroke="#65a30d" strokeWidth="5"></path></g><path d="M60 14 L64.5 33 L83 37.5 L64.5 42 L60 61 L55.5 42 L37 37.5 L55.5 33 Z" fill="#f59e0b"></path><circle cx="60" cy="60" r="52" fill="none" stroke="#bef264" strokeWidth="3"></circle></svg>
            </span>
            <div>
              <h1 className="wordmark" aria-label="Mannova">Mann<span className="wm-star" aria-hidden><svg viewBox="0 0 100 100"><path d="M50 2 L58.5 41.5 L98 50 L58.5 58.5 L50 98 L41.5 58.5 L2 50 L41.5 41.5 Z" fill="#f59e0b" /></svg></span>va</h1>
              <p>New life for Kerala&apos;s soil: crop rotations guided by NASA satellites</p>
            </div>
          </div>
          <div className="hero-chips">
            <span>🛰 NASA POWER · 25 yrs</span>
            <span>🌾 14 Kerala crops</span>
            <span>📍 7 farming zones</span>
          </div>
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <Step n={1} title="Your field">
            <label>Farming region
              <select value={regionId} onChange={(e) => chooseRegion(e.target.value)}>
                {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.district})</option>)}
                <option value="custom">Custom: click on the map</option>
              </select>
            </label>
            {region && <p className="hint">{region.blurb}</p>}
            <FieldMap lat={lat} lon={lon} zoom={zoom} onPick={(a, b) => { setLat(+a.toFixed(4)); setLon(+b.toFixed(4)); setRegionId("custom"); setClimate(null); }} />
            {!inKerala(lat, lon) && <p className="error">Outside Kerala: climate data still loads, but the crop list is tuned for Kerala.</p>}
            {regionId === "custom" && <p className="hint warn-hint">Custom point: check that the soil and water settings below match this field.</p>}
            <div className="row">
              <label>Latitude <input type="number" step="0.01" value={lat} onChange={(e) => setLat(+e.target.value)} /></label>
              <label>Longitude <input type="number" step="0.01" value={lon} onChange={(e) => setLon(+e.target.value)} /></label>
            </div>
          </Step>

          <Step n={2} title="Soil and water">
            <div className="row">
              <label>Soil
                <select value={inputs.soilTexture} onChange={(e) => set("soilTexture", e.target.value as FarmInputs["soilTexture"])}>
                  <option value="clay">Clay</option><option value="loam">Loam</option><option value="sandy">Sandy</option><option value="laterite">Laterite</option><option value="peaty">Peaty / Kari</option>
                </select>
              </label>
              <label>Drainage
                <select value={inputs.drainage} onChange={(e) => set("drainage", e.target.value as FarmInputs["drainage"])}>
                  <option value="good">Good</option><option value="moderate">Moderate</option><option value="poor">Poor</option>
                </select>
              </label>
            </div>
            <div className="row">
              <label>Salinity
                <select value={inputs.salinity} onChange={(e) => set("salinity", e.target.value as FarmInputs["salinity"])}>
                  <option value="none">None</option><option value="seasonal">Seasonal</option><option value="high">High</option>
                </select>
              </label>
              <label>Irrigation
                <select value={inputs.irrigation} onChange={(e) => set("irrigation", e.target.value as FarmInputs["irrigation"])}>
                  <option value="none">Rain-fed</option><option value="limited">Limited</option><option value="full">Reliable</option>
                </select>
              </label>
            </div>
          </Step>

          <Step n={3} title="What you grow now">
            {SEASONS.map((s, i) => (
              <label key={s.id} className="inline">
                <span>{s.window}<small>{s.desc}</small></span>
                <select value={inputs.current[i]} onChange={(e) => { const c = [...inputs.current] as FarmInputs["current"]; c[i] = e.target.value; set("current", c); }}>
                  {CROPS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            ))}
          </Step>

          <Step n={4} title="What matters to you?">
            {PRIORITIES.map(([k, label, icon]) => (
              <label key={k} className="slider">
                <span><i>{icon}</i>{label}<b>{inputs.priorities[k]}</b></span>
                <input type="range" min={0} max={10} value={inputs.priorities[k]} onChange={(e) => setPriority(k, +e.target.value)} />
              </label>
            ))}
          </Step>

          <details className="step step-collapsible">
            <summary className="step-head"><span className="step-n">5</span><h3>Crops you can grow</h3><em>{CROPS.length - 1 - (inputs.exclude?.length ?? 0)} selected</em></summary>
            <p className="hint">Untick crops you have no seed, equipment or buyer for.</p>
            <div className="chips">
              {CROPS.filter((c) => c.id !== "fallow").map((c) => {
                const on = !(inputs.exclude ?? []).includes(c.id);
                return <button key={c.id} type="button" className={`chip ${on ? "on" : ""}`} onClick={() => toggleExclude(c.id)}>{on ? "✓ " : ""}{c.name.replace(" (green manure)", "")}</button>;
              })}
            </div>
          </details>

          <details className="step step-collapsible">
            <summary className="step-head"><span className="step-n">6</span><h3>What if?</h3><em>{scenarioNote ?? "Scenario"}</em></summary>
            <p className="hint">Test the strategies against a different future.</p>
            <label className="slider"><span>Rainfall change<b>{rainPct > 0 ? "+" : ""}{rainPct}%</b></span>
              <input type="range" min={-30} max={30} step={5} value={rainPct} onChange={(e) => setRainPct(+e.target.value)} />
            </label>
            <label className="slider"><span>Warming<b>+{tDelta} °C</b></span>
              <input type="range" min={0} max={3} step={0.5} value={tDelta} onChange={(e) => setTDelta(+e.target.value)} />
            </label>
          </details>

          <div className="cta">
            <button className="primary" onClick={analyze} disabled={loading}>
              {loading ? <><span className="spinner" /> Fetching NASA data…</> : climate ? "Re-analyse field" : "Analyse my field"}
            </button>
            {error && <p className="error">{error}</p>}
          </div>
        </aside>

        <div className="results">
          {!climate && !loading && (
            <section className="card empty">
              <div className="empty-art" aria-hidden>🛰️</div>
              <h2>Pick a field, then press <em>Analyse my field</em></h2>
              <p>Mannova pulls 25 years of NASA climate records for that spot, tests about 2,000 three-season rotations against them, and compares the best options with what you grow now.</p>
              <ol className="how">
                <li><b>Choose a region</b> or click your field on the map</li>
                <li><b>Adjust</b> soil, water and what you grow now</li>
                <li><b>Set your priorities</b> and compare strategies</li>
              </ol>
            </section>
          )}
          {loading && (
            <section className="card empty">
              <div className="spinner big" />
              <h2>Fetching NASA POWER records…</h2>
              <p>The first request for a location can take 10–30 seconds.</p>
            </section>
          )}
          {climate && results && (
            <>
              <ClimateSnapshot c={climate} place={place} />
              <section className="card">
                <div className="section-head">
                  <div>
                    <h2>Rotation strategies</h2>
                    <p className="muted">{results.explored.toLocaleString()} rotations tested · your current rotation and the 3 best different options · click one for details</p>
                  </div>
                  {scenarioNote && <span className="pill pill-amber">Scenario: {scenarioNote}</span>}
                </div>
                <StrategyGrid items={items} selected={keyOf(selIdx)} onSelect={setSelected} />
              </section>
              <StrategyDetail r={items[selIdx]} current={results.current} label={selIdx === 0 ? "Your current rotation" : `Option ${selIdx}${selIdx === 1 ? " · best match" : ""}`} />
              <ClimateCharts c={climate} />
              <Glossary />
            </>
          )}
          <footer className="sources">
            <h4>Data sources</h4>
            <ul>
              <li><b>NASA POWER</b> (Agroclimatology): monthly temperature, bias-corrected precipitation, humidity and root-zone soil wetness · power.larc.nasa.gov</li>
              <li>Reference evapotranspiration (ET₀): Hargreaves method (FAO-56) applied to NASA POWER temperatures</li>
              <li>Crop characteristics: indicative values for 14 Kerala crops; verify with the KAU Package of Practices</li>
              <li>Region presets: typical conditions for Kerala&apos;s farming zones</li>
            </ul>
            <p>Decision support only: Mannova compares options; it does not replace farmers&apos; judgement or local agricultural advice.</p>
          </footer>
        </div>
      </main>
    </>
  );
}
