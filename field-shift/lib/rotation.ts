import { applyScenario, MONTH_LABELS, type ClimateProfile } from "./climate";
import { CROPS, CROP_BY_ID, type Crop } from "./crops";

export const SEASONS = [
  { id: "s1", name: "Season 1", window: "Jun–Sep", desc: "Southwest monsoon", months: [6, 7, 8, 9] },
  { id: "s2", name: "Season 2", window: "Oct–Jan", desc: "Northeast monsoon / post-monsoon", months: [10, 11, 12, 1] },
  { id: "s3", name: "Season 3", window: "Feb–May", desc: "Dry summer", months: [2, 3, 4, 5] },
] as const;

export interface FarmInputs {
  soilTexture: "clay" | "loam" | "sandy" | "laterite" | "peaty";
  drainage: "good" | "moderate" | "poor";
  salinity: "none" | "seasonal" | "high";
  irrigation: "none" | "limited" | "full";
  priorities: { water: number; soil: number; income: number; risk: number }; // 0–10 each
  current: [string, string, string]; // crop ids for the three seasons
  exclude?: string[]; // crops the farmer can't grow or sell
}

export interface SeasonEval {
  seasonIdx: number;
  crop: Crop;
  cropMonths: number[]; // calendar months the crop is in the field
  window: string;
  rainMm: number;
  et0Mm: number;
  dryRainMm: number;
  peakMonthMm: number;
  tMax: number;
  irrigationMm: number;
  risks: { flood: number; drought: number; heat: number; salinity: number };
  fit: number; // 0–1, overall suitability
  notes: string[];
}

export interface MonthCell {
  month: number;
  crop: Crop | null; // null = bare / fallow
  seasonIdx: number;
  vulnerable: boolean;
}

export interface Explanation {
  why: string;
  evidence: string[];
  benefits: string[];
  gaps: string[];
  review: string[];
}

export interface RotationResult {
  key: string;
  crops: Crop[];
  seasons: SeasonEval[];
  calendar: MonthCell[];
  bareMonths: number;
  irrigationMm: number;
  scores: { water: number; soil: number; income: number; risk: number; overall: number };
  range?: [number, number]; // overall score across drier/hotter and wetter futures
  highlights: string[];
  warnings: string[];
  explanation?: Explanation;
  isCurrent: boolean;
}

const clamp = (x: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const RISK_TEXT = { flood: "waterlogging / flood risk", drought: "dry-year water shortfall", heat: "heat stress", salinity: "salinity risk" } as const;
const PRIORITY_TEXT = { water: "saving water", soil: "soil health", income: "income", risk: "avoiding climate risk" } as const;
const SCORE_TEXT = { water: "water saving", soil: "soil health", income: "income", risk: "climate safety" } as const;

function evalSeason(crop: Crop, seasonIdx: number, c: ClimateProfile, f: FarmInputs): SeasonEval {
  const season = SEASONS[seasonIdx];
  // Only the months the crop is actually in the field (crop is sown at the start of the season).
  const nMonths = crop.id === "fallow" ? season.months.length : Math.min(season.months.length, Math.max(1, Math.ceil(crop.durationDays / 30.4)));
  const cropMonths = season.months.slice(0, nMonths);
  const ms = cropMonths.map((m) => c.months[m - 1]);
  // Score against recent conditions: scale rain by recent-decade change, shift temperature by half the warming.
  const rainFactor = clamp(1 + c.recentVsEarly.rainPct / 100, 0.7, 1.3);
  const seasonRain = sum(ms.map((m) => m.rainMm)) * rainFactor;
  const dryYearRain = sum(ms.map((m) => m.rainP20Mm)) * rainFactor;
  const peakMonth = Math.max(...ms.map((m) => m.rainP90Mm));
  const et0 = sum(ms.map((m) => m.et0Mm));
  const tMax = sum(ms.map((m) => m.tMax)) / ms.length + c.recentVsEarly.tMaxDelta / 2;
  const window = `${ms[0].label}–${ms[ms.length - 1].label}`;
  const base = { seasonIdx, crop, cropMonths, window, rainMm: Math.round(seasonRain), et0Mm: Math.round(et0), dryRainMm: Math.round(dryYearRain), peakMonthMm: Math.round(peakMonth), tMax: Math.round(tMax * 10) / 10 };

  if (crop.id === "fallow") {
    return { ...base, irrigationMm: 0, risks: { flood: 0, drought: 0, heat: 0, salinity: 0 }, fit: 1, notes: ["Field rests; no income, soil left uncovered."] };
  }

  const frac = clamp(crop.durationDays / (nMonths * 30.4));
  // Bunded, puddled paddy fields hold most of the rain; upland crops lose more to runoff and drainage.
  const effFactor = crop.id === "rice" ? 0.85 : f.soilTexture === "sandy" ? 0.55 : f.soilTexture === "laterite" ? 0.6 : f.soilTexture === "loam" ? 0.65 : 0.75;
  const effRain = seasonRain * frac * effFactor;
  const irrigationMm = Math.max(0, crop.waterMm - effRain);
  const dryNeed = Math.max(0, crop.waterMm - dryYearRain * frac * effFactor);

  const access = { none: 1, limited: 0.5, full: 0.1 }[f.irrigation];
  const drought = clamp((dryNeed / crop.waterMm) * access);
  const drainMult = { poor: 1.3, moderate: 1, good: 0.6 }[f.drainage];
  const flood = clamp(clamp((peakMonth - 350) / 400) * drainMult * (1 - crop.floodTol));
  const [lo, hi] = crop.tMaxRange;
  const heat = clamp(tMax > hi ? (tMax - hi) * 0.12 : tMax < lo ? (lo - tMax) * 0.12 : 0);
  const salLevel = f.salinity === "none" ? 0 : seasonIdx === 2 ? (f.salinity === "high" ? 1 : 0.6) : seasonIdx === 1 && f.salinity === "high" ? 0.5 : 0;
  const salinity = clamp(salLevel * (1 - crop.salinityTol));

  const fit = (1 - flood) * (1 - drought) * (1 - heat) * (1 - salinity);
  const notes: string[] = [];
  if (flood > 0.3) notes.push(`Waterlogging risk: in a 1-in-10 wet year, ${window} sees months of ~${Math.round(peakMonth)} mm.`);
  if (drought > 0.2) notes.push(`In a 1-in-5 dry year, ${window} falls ~${Math.round(dryNeed)} mm short; needs irrigation.`);
  if (heat > 0.2) notes.push(`Heat stress: average max ${tMax.toFixed(1)} °C is ${tMax > hi ? "above" : "below"} ${crop.name}'s comfort range.`);
  if (salinity > 0.3) notes.push("Salinity risk in this season.");
  notes.push(`In the field ${window}.`);
  if (irrigationMm > 0) notes.push(`Typical-year irrigation need ≈ ${Math.round(irrigationMm)} mm.`);
  else notes.push("Rainfall covers the crop's water need in a typical year.");

  return { ...base, irrigationMm: Math.round(irrigationMm), risks: { flood, drought, heat, salinity }, fit, notes };
}

function soilScore(crops: Crop[], f: FarmInputs, bareMonths: number): number {
  let s = 50;
  crops.forEach((cr, i) => {
    if (cr.greenManure) s += 18;
    else if (cr.legume) s += 12;
    if (cr.roles?.includes("Cover crop") && !cr.legume) s += 6;
    if (cr.roles?.includes("Deep-rooting") && !cr.greenManure) s += 3;
    if (cr.id === "rice") s -= 3;
    const next = crops[(i + 1) % crops.length];
    if (cr.id !== "fallow" && next.id === cr.id) s -= 10; // same crop back-to-back (incl. year wrap-around)
    else if (cr.id !== "fallow" && next.family === cr.family) s -= 8; // same plant family back-to-back: pests and diseases carry over
  });
  s -= bareMonths * 2.5; // bare soil: erosion, weeds, organic matter loss
  const families = new Set(crops.filter((c) => c.id !== "fallow").map((c) => c.family));
  s += Math.max(0, families.size - 1) * 6;
  if ((f.soilTexture === "sandy" || f.soilTexture === "laterite") && crops.some((c) => c.legume)) s += 4; // low-fertility soils gain most from legumes
  return Math.round(clamp(s, 0, 100));
}

function buildCalendar(seasons: SeasonEval[]): MonthCell[] {
  const cells: MonthCell[] = MONTH_LABELS.map((_, i) => ({ month: i + 1, crop: null, seasonIdx: -1, vulnerable: false }));
  seasons.forEach((s) => {
    SEASONS[s.seasonIdx].months.forEach((m) => {
      const cell = cells[m - 1];
      cell.seasonIdx = s.seasonIdx;
      if (s.crop.id !== "fallow" && s.cropMonths.includes(m)) {
        cell.crop = s.crop;
        cell.vulnerable = s.fit < 0.6;
      }
    });
  });
  return cells;
}

export function evaluateRotation(ids: string[], c: ClimateProfile, f: FarmInputs, isCurrent = false): RotationResult {
  const crops = ids.map((id) => CROP_BY_ID[id]);
  const seasons = crops.map((cr, i) => evalSeason(cr, i, c, f));
  const calendar = buildCalendar(seasons);
  const bareMonths = calendar.filter((m) => !m.crop).length;
  const irrigationMm = sum(seasons.map((s) => s.irrigationMm));
  const water = Math.round(clamp(100 - irrigationMm / 15, 0, 100));
  const soil = soilScore(crops, f, bareMonths);
  const income = Math.round(clamp((sum(seasons.map((s) => s.crop.incomeIdx * s.fit)) / 1.8) * 100, 0, 100));
  const cropped = seasons.filter((s) => s.crop.id !== "fallow");
  const risk = Math.round((sum(cropped.map((s) => s.fit)) / Math.max(1, cropped.length)) * 100);
  const p = f.priorities;
  const wsum = p.water + p.soil + p.income + p.risk || 1;
  const overall = Math.round((water * p.water + soil * p.soil + income * p.income + risk * p.risk) / wsum);

  const highlights: string[] = [];
  const warnings0: string[] = [];
  const legumes = crops.filter((cr) => cr.legume);
  if (legumes.length) highlights.push(`${legumes.map((l) => l.name).join(", ")} ${legumes.length > 1 ? "fix" : "fixes"} nitrogen and cuts fertiliser needs.`.replace("fix nitrogen and cuts", "fix nitrogen and cut"));
  const families = new Set(crops.filter((cr) => cr.id !== "fallow").map((cr) => cr.family));
  if (families.size >= 3) highlights.push("Three different crop families help break pest and disease cycles.");
  const familyRepeat = crops.some((cr, i) => cr.id !== "fallow" && crops[(i + 1) % crops.length].family === cr.family);
  if (familyRepeat) warnings0.push("Same crop or crop family in consecutive seasons; pests and diseases can carry over.");
  if (crops.filter((cr) => cr.id === "rice").length === 1) highlights.push("Breaks the rice-after-rice cycle while keeping one rice season.");
  if (irrigationMm < 200) highlights.push("Mostly rain-fed in a typical year.");
  const warnings = [...warnings0, ...seasons.flatMap((s) => {
    if (s.fit >= 0.6) return [];
    const [k] = (Object.entries(s.risks) as [keyof typeof RISK_TEXT, number][]).sort((a, b) => b[1] - a[1])[0];
    return [`${s.window} – ${s.crop.name}: main concern is ${RISK_TEXT[k]}.`];
  })];

  return { key: ids.join("-"), crops, seasons, calendar, bareMonths, irrigationMm, scores: { water, soil, income, risk, overall }, highlights, warnings, isCurrent };
}

function explain(r: RotationResult, rank: number, total: number, current: RotationResult, c: ClimateProfile, f: FarmInputs): Explanation {
  const p = f.priorities;
  const topPriority = (Object.keys(p) as (keyof typeof p)[]).sort((a, b) => p[b] - p[a])[0];
  const best = (Object.keys(SCORE_TEXT) as (keyof typeof SCORE_TEXT)[]).sort((a, b) => r.scores[b] - r.scores[a]).slice(0, 2);
  const why = r.isCurrent
    ? "This is what you grow now: the baseline every option is compared with."
    : `Ranked #${rank} of ${total} rotations explored for your priorities (you weighted ${PRIORITY_TEXT[topPriority]} highest). It scores best on ${SCORE_TEXT[best[0]]} and ${SCORE_TEXT[best[1]]}.`;

  const evidence: string[] = [];
  const sign = (x: number) => (x > 0 ? "+" : "");
  evidence.push(`NASA POWER ${c.startYear}–${c.endYear}: the last 10 years were ${sign(c.recentVsEarly.rainPct)}${c.recentVsEarly.rainPct}% in rainfall and ${sign(c.recentVsEarly.tMaxDelta)}${c.recentVsEarly.tMaxDelta} °C in max temperature compared with the first 10. Scores use these recent conditions.`);
  r.seasons.filter((s) => s.crop.id !== "fallow").forEach((s) => {
    const bal = s.rainMm - s.et0Mm;
    const balText = bal >= 0 ? `a surplus of ~${bal} mm` : `a deficit of ~${-bal} mm (rain covers ${Math.round((s.rainMm / s.et0Mm) * 100)}%)`;
    evidence.push(`${s.crop.name}, ${s.window}: ~${s.rainMm} mm rain against ~${s.et0Mm} mm evaporative demand (ET₀), ${balText}. A 1-in-5 dry year brings ${s.dryRainMm} mm; a 1-in-10 wet month reaches ${s.peakMonthMm} mm. Average max ${s.tMax} °C.`);
  });

  const compare: string[] = [];
  const benefits: string[] = [];
  const roles = new Set(r.crops.flatMap((cr) => cr.roles ?? []));
  if (roles.has("Cover crop")) benefits.push("Includes a cover crop that protects soil from heavy monsoon rain and erosion.");
  if (roles.has("Deep-rooting")) benefits.push("Includes a deep-rooting crop that improves infiltration and loosens compacted layers.");
  if (roles.has("Drought-tolerant")) benefits.push("Includes a drought-tolerant crop for the driest part of the year.");
  if (!r.isCurrent) {
    const dBare = current.bareMonths - r.bareMonths;
    if (dBare > 0) compare.push(`Field is bare ${r.bareMonths} month${r.bareMonths === 1 ? "" : "s"} a year instead of ${current.bareMonths}.`);
    const dWater = current.irrigationMm - r.irrigationMm;
    if (dWater > 50) compare.push(`Needs ~${dWater} mm less irrigation a year than your current rotation.`);
    const dSoil = r.scores.soil - current.scores.soil;
    if (dSoil > 5) compare.push(`Soil health score ${current.scores.soil} → ${r.scores.soil}.`);
  } else if (r.bareMonths > 0) {
    benefits.push(`Field is currently bare ${r.bareMonths} month${r.bareMonths === 1 ? "" : "s"} a year.`);
  }

  const allBenefits = [...compare, ...r.highlights, ...benefits].slice(0, 6);

  const gaps = [
    "NASA POWER is a ~50 km grid: it can't see your field's microclimate, canal or backwater supply, or bund height.",
    "Crop water needs, temperature ranges and tolerances are indicative values, not measured on your farm.",
    "Soil type, drainage and salinity come from your inputs, not from a soil test.",
    "No local price or market data yet; the income score uses relative values only.",
  ];
  if (r.range && r.range[1] - r.range[0] >= 8) gaps.push(`Result is sensitive to rainfall: the score ranges ${r.range[0]}–${r.range[1]} between drier/hotter and wetter years.`);

  const review = [...r.warnings];
  const newCrops = r.crops.filter((cr) => cr.id !== "fallow" && !current.crops.some((x) => x.id === cr.id));
  if (newCrops.length) review.push(`Check seed availability, varieties and a buyer nearby for ${newCrops.map((x) => x.name).join(", ")}.`);
  review.push("Confirm sowing dates and varieties with your Krishi Bhavan or the KAU Package of Practices.");
  if (f.salinity !== "none" && r.crops[2].id !== "fallow") review.push("Test soil or water salinity (EC) before sowing in the summer season.");
  if (r.seasons.some((s) => s.risks.flood > 0.3)) review.push("Check that field drainage and bunds can handle a wet-year month before sowing a non-rice crop.");

  return { why, evidence, benefits: allBenefits, gaps, review };
}

/** Explore every 3-season combination and return the best few distinct options plus the farmer's current rotation. */
export function exploreRotations(c: ClimateProfile, f: FarmInputs, top = 3) {
  const excluded = new Set(f.exclude ?? []);
  const ids = CROPS.map((cr) => cr.id).filter((id) => !excluded.has(id));
  const all: RotationResult[] = [];
  for (const a of ids) for (const b of ids) for (const d of ids) {
    const combo = [a, b, d];
    if (combo.filter((x) => x === "fallow").length >= 2) continue;
    if (a === b && b === d) continue;
    // Only rice is commonly grown in back-to-back seasons; skip repeats of other crops.
    if (combo.some((x, i) => x !== "rice" && x !== "fallow" && x === combo[(i + 1) % 3])) continue;
    all.push(evaluateRotation(combo, c, f));
  }
  all.sort((x, y) => y.scores.overall - x.scores.overall);

  const picked: RotationResult[] = [];
  for (const r of all) {
    const tooSimilar = picked.some((p) => p.crops.filter((cr, i) => cr.id === r.crops[i].id).length >= 2);
    if (!tooSimilar) picked.push(r);
    if (picked.length === top) break;
  }
  const current = evaluateRotation(f.current, c, f, true);

  // Uncertainty: re-score each shown rotation in a drier/hotter and a wetter future.
  const dry = applyScenario(c, -15, 0.5), wet = applyScenario(c, 15, 0);
  for (const r of [current, ...picked]) {
    const ids3 = r.crops.map((cr) => cr.id);
    const vals = [r.scores.overall, evaluateRotation(ids3, dry, f).scores.overall, evaluateRotation(ids3, wet, f).scores.overall];
    r.range = [Math.min(...vals), Math.max(...vals)];
  }
  current.explanation = explain(current, 0, all.length, current, c, f);
  picked.forEach((r) => {
    const rank = all.indexOf(r) + 1;
    r.explanation = explain(r, rank, all.length, current, c, f);
  });
  return { explored: all.length, options: picked, current };
}
