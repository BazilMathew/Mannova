"use client";

import type { RotationResult } from "@/lib/rotation";
import { SEASONS } from "@/lib/rotation";
import { MONTH_LABELS } from "@/lib/climate";

const SCORE_LABELS: [keyof RotationResult["scores"], string][] = [
  ["water", "Water saving"],
  ["soil", "Soil health"],
  ["income", "Income"],
  ["risk", "Climate safety"],
];

const CROP_COLORS: Record<string, string> = {
  rice: "#84cc16", cowpea: "#f59e0b", greengram: "#22c55e", sesame: "#a78bfa", okra: "#14b8a6", amaranthus: "#ec4899",
  bittergourd: "#0ea5e9", sunhemp: "#eab308", groundnut: "#c2410c", blackgram: "#64748b", horsegram: "#b45309",
  sweetpotato: "#9333ea", cabbage: "#10b981",
};

function Bar({ v }: { v: number }) {
  const color = v >= 70 ? "#1f7a4d" : v >= 45 ? "#d97706" : "#dc2626";
  return (
    <div className="bar"><div style={{ width: `${v}%`, background: color }} /><span>{v}</span></div>
  );
}

function Calendar({ r }: { r: RotationResult }) {
  return (
    <div className="calendar" aria-label="12-month field calendar">
      {r.calendar.map((m) => (
        <div
          key={m.month}
          className={`cal ${m.crop ? "" : "bare"} ${m.vulnerable ? "vuln" : ""}`}
          style={m.crop ? { background: CROP_COLORS[m.crop.id] ?? "#94a3b8" } : undefined}
          title={`${MONTH_LABELS[m.month - 1]}: ${m.crop ? m.crop.name : "bare / fallow"}${m.vulnerable ? " (vulnerable)" : ""}`}
        >
          <span>{MONTH_LABELS[m.month - 1][0]}</span>
        </div>
      ))}
    </div>
  );
}

function Section({ title, items, cls }: { title: string; items: string[]; cls?: string }) {
  if (!items.length) return null;
  return (
    <div className="xsec">
      <h4>{title}</h4>
      <ul className={cls}>{items.map((x) => <li key={x}>{x}</li>)}</ul>
    </div>
  );
}

export default function RotationCards({ options, current, explored, scenarioNote }: { options: RotationResult[]; current: RotationResult; explored: number; scenarioNote?: string }) {
  const all = [current, ...options];
  return (
    <section className="card">
      <h2>Rotation strategies</h2>
      <p className="muted">
        Explored {explored} three-season rotations, scored against your priorities. Showing your current rotation and the top {options.length} different options.
        {scenarioNote && <b className="scenario"> Scenario: {scenarioNote}</b>}
      </p>
      <div className="legend">
        <span><i className="sw bare" /> Bare / fallow</span>
        <span><i className="sw vuln" /> Crop vulnerable (fit &lt; 60%)</span>
      </div>
      <div className="rotations">
        {all.map((r, idx) => (
          <article key={r.key + idx} className={`rot ${r.isCurrent ? "current" : ""}`}>
            <header>
              <strong>{r.isCurrent ? "Your current rotation" : `Option ${idx}`}</strong>
              <span className="overall" title="Overall score for your priorities">{r.scores.overall}</span>
            </header>
            {r.range && <p className="range">Range {r.range[0]}–{r.range[1]} in drier/hotter vs wetter years</p>}
            <ol className="seq">
              {r.seasons.map((s) => (
                <li key={s.seasonIdx}>
                  <small>{SEASONS[s.seasonIdx].window}</small>
                  <b>{s.crop.name}</b>
                  <em>{s.crop.ml}</em>
                </li>
              ))}
            </ol>
            <Calendar r={r} />
            <p className="muted small">Bare {r.bareMonths} of 12 month{r.bareMonths === 1 ? "" : "s"} · irrigation ≈ {r.irrigationMm} mm/yr</p>
            {SCORE_LABELS.map(([k, label]) => (
              <div key={k} className="score"><label>{label}</label><Bar v={r.scores[k]} /></div>
            ))}
            {r.explanation && (
              <>
                <p className="why">{r.explanation.why}</p>
                <Section title="Benefits" items={r.explanation.benefits} cls="good" />
                <Section title="Check locally before acting" items={r.explanation.review} cls="warn" />
                <details>
                  <summary>Evidence from NASA data</summary>
                  <ul className="evid">{r.explanation.evidence.map((x) => <li key={x}>{x}</li>)}</ul>
                </details>
                <details>
                  <summary>Information gaps</summary>
                  <ul className="evid">{r.explanation.gaps.map((x) => <li key={x}>{x}</li>)}</ul>
                </details>
              </>
            )}
            <details>
              <summary>Season by season</summary>
              {r.seasons.map((s) => (
                <div key={s.seasonIdx} className="season">
                  <b>{SEASONS[s.seasonIdx].window} · {s.crop.name}</b> — rain ≈ {s.rainMm} mm, fit {Math.round(s.fit * 100)}%
                  {s.crop.roles && <div className="roles">{s.crop.roles.map((x) => <span key={x}>{x}</span>)}</div>}
                  <ul>{s.notes.map((n) => <li key={n}>{n}</li>)}</ul>
                </div>
              ))}
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
