"use client";

import type { RotationResult } from "@/lib/rotation";
import { SEASONS } from "@/lib/rotation";
import ScoreRing, { scoreColor } from "./ScoreRing";
import FieldCalendar from "./FieldCalendar";

const SCORE_LABELS: [keyof RotationResult["scores"], string][] = [
  ["water", "Water saving"],
  ["soil", "Soil health"],
  ["income", "Income"],
  ["risk", "Climate safety"],
];

function List({ title, items, kind }: { title: string; items: string[]; kind: "good" | "warn" | "plain" }) {
  if (!items.length) return null;
  return (
    <div className={`panel panel-${kind}`}>
      <h4>{title}</h4>
      <ul className={`icon-list ${kind}`}>{items.map((x) => <li key={x}>{x}</li>)}</ul>
    </div>
  );
}

export default function StrategyDetail({ r, current, label }: { r: RotationResult; current: RotationResult; label: string }) {
  const e = r.explanation;
  return (
    <section className="card detail">
      <div className="detail-head">
        <div>
          <span className="eyebrow">{label}</span>
          <h2 className="detail-title">
            {r.crops.map((c, i) => (
              <span key={i}>{i > 0 && <i className="arrow">→</i>}{c.name.replace(" (green manure)", "")}</span>
            ))}
          </h2>
          <FieldCalendar r={r} showLabels />
          <div className="legend">
            <span><i className="sw bare" /> Bare / fallow</span>
            <span><i className="sw vuln" /> Crop vulnerable</span>
          </div>
        </div>
        <div className="detail-score">
          <ScoreRing value={r.scores.overall} size={88} stroke={9} muted={r.isCurrent} />
          {r.range && <small>Range {r.range[0]}–{r.range[1]}</small>}
        </div>
      </div>

      <div className="score-row">
        {SCORE_LABELS.map(([k, name]) => {
          const d = r.scores[k] - current.scores[k];
          return (
            <div key={k} className="score-tile">
              <span>{name}</span>
              <b style={{ color: scoreColor(r.scores[k]) }}>{r.scores[k]}</b>
              {!r.isCurrent && d !== 0 && <em className={d > 0 ? "up" : "down"}>{d > 0 ? "▲" : "▼"} {Math.abs(d)} vs now</em>}
            </div>
          );
        })}
      </div>

      {e && (
        <>
          <p className="why">{e.why}</p>
          <div className="two-col">
            <List title="Benefits" items={e.benefits} kind="good" />
            <List title="Check locally before acting" items={e.review} kind="warn" />
          </div>
        </>
      )}

      <h3>Season by season</h3>
      <div className="season-table">
        {r.seasons.map((s) => (
          <div key={s.seasonIdx} className="season-row">
            <div className="season-when">
              <b>{SEASONS[s.seasonIdx].window}</b>
              <small>{SEASONS[s.seasonIdx].desc}</small>
            </div>
            <div className="season-crop">
              <b>{s.crop.name}</b> <span className="ml">{s.crop.ml}</span>
              {s.crop.roles && <div className="roles">{s.crop.roles.map((x) => <span key={x}>{x}</span>)}</div>}
            </div>
            <div className="season-water">
              {s.crop.id !== "fallow" ? (
                <>
                  <small>Rain {s.rainMm} mm · ET₀ {s.et0Mm} mm</small>
                  <div className="track"><div style={{ width: `${Math.round(s.fit * 100)}%`, background: scoreColor(s.fit * 100) }} /></div>
                  <small>Climate fit {Math.round(s.fit * 100)}%</small>
                </>
              ) : <small>Field rests</small>}
            </div>
            <ul className="season-notes">{s.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
        ))}
      </div>

      {e && (
        <div className="two-col">
          <List title="Evidence from NASA data" items={e.evidence} kind="plain" />
          <List title="Information gaps" items={e.gaps} kind="plain" />
        </div>
      )}
    </section>
  );
}
