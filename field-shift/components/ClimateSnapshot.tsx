import type { ClimateProfile } from "@/lib/climate";

export default function ClimateSnapshot({ c, place }: { c: ClimateProfile; place: string }) {
  const sign = (x: number) => (x > 0 ? "+" : "");
  const deficit = c.months.filter((m) => m.balanceMm < 0).length;
  const tiles = [
    { k: "rain", v: `${c.annualRainMm.toLocaleString()} mm`, l: "Average rainfall per year" },
    { k: c.recentVsEarly.rainPct < 0 ? "dry" : "wet", v: `${sign(c.recentVsEarly.rainPct)}${c.recentVsEarly.rainPct}%`, l: "Rainfall, last 10 yrs vs first 10" },
    { k: "heat", v: `${sign(c.recentVsEarly.tMaxDelta)}${c.recentVsEarly.tMaxDelta} °C`, l: "Change in max temperature" },
    { k: "deficit", v: `${deficit} months`, l: "Rain below evaporative demand" },
  ];
  return (
    <section className="snapshot">
      <div className="snapshot-head">
        <span className="eyebrow">NASA POWER · {c.startYear}–{c.endYear}</span>
        <h2>{place}</h2>
        <small>{c.lat.toFixed(3)}°N, {c.lon.toFixed(3)}°E</small>
      </div>
      <div className="snapshot-tiles">
        {tiles.map((t) => (
          <div key={t.l} className={`tile tile-${t.k}`}>
            <b>{t.v}</b>
            <span>{t.l}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
