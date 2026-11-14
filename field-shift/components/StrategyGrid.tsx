"use client";

import type { RotationResult } from "@/lib/rotation";
import { SEASONS } from "@/lib/rotation";
import ScoreRing, { scoreColor } from "./ScoreRing";
import FieldCalendar from "./FieldCalendar";

const MINI: [keyof RotationResult["scores"], string][] = [
  ["water", "Water"],
  ["soil", "Soil"],
  ["income", "Income"],
  ["risk", "Safety"],
];

export default function StrategyGrid({ items, selected, onSelect }: { items: RotationResult[]; selected: string; onSelect: (key: string) => void }) {
  return (
    <div className="strategy-grid">
      {items.map((r, idx) => {
        const key = r.isCurrent ? "current" : r.key;
        return (
          <button key={key} className={`strategy ${selected === key ? "selected" : ""} ${r.isCurrent ? "is-current" : ""}`} onClick={() => onSelect(key)}>
            <div className="strategy-top">
              <div>
                <span className={`pill ${r.isCurrent ? "pill-muted" : "pill-green"}`}>{r.isCurrent ? "Current" : `Option ${idx}`}</span>
                {idx === 1 && <span className="pill pill-amber">Best match</span>}
              </div>
              <ScoreRing value={r.scores.overall} muted={r.isCurrent} />
            </div>
            {r.range && <p className="range">Range {r.range[0]}–{r.range[1]} across dry & wet years</p>}
            <ol className="crop-seq">
              {r.seasons.map((s) => (
                <li key={s.seasonIdx}>
                  <small>{SEASONS[s.seasonIdx].window}</small>
                  <b>{s.crop.name.replace(" (green manure)", "")}</b>
                  <span className="ml">{s.crop.ml}</span>
                </li>
              ))}
            </ol>
            <FieldCalendar r={r} />
            <div className="mini-bars">
              {MINI.map(([k, label]) => (
                <div key={k} className="mini">
                  <span>{label}</span>
                  <div className="track"><div style={{ width: `${r.scores[k]}%`, background: scoreColor(r.scores[k]) }} /></div>
                  <b>{r.scores[k]}</b>
                </div>
              ))}
            </div>
            <p className="strategy-foot">Bare {r.bareMonths} mo · {r.irrigationMm} mm irrigation/yr</p>
          </button>
        );
      })}
    </div>
  );
}
