import type { PowerMonthly } from "./power";

export const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export interface MonthNormal {
  month: number; // 1–12
  label: string;
  rainMm: number; // average monthly total
  rainMaxMm: number; // wettest year on record for this month (flood proxy)
  rainMinMm: number; // driest year on record for this month
  rainP20Mm: number; // 1-in-5 dry year for this month (drought proxy)
  rainP90Mm: number; // 1-in-10 wet year for this month (flood proxy)
  tMean: number;
  tMax: number;
  tMin: number;
  rh: number;
  soilWetness: number | null; // 0–1
  et0Mm: number; // reference evapotranspiration (Hargreaves, from NASA POWER temperatures)
  balanceMm: number; // rain minus ET0: positive = surplus, negative = deficit
}

export interface YearStat {
  year: number;
  rainMm: number;
  tMax: number;
}

export interface ClimateProfile {
  lat: number;
  lon: number;
  startYear: number;
  endYear: number;
  source: string;
  months: MonthNormal[];
  years: YearStat[];
  annualRainMm: number;
  rainTrendPerDecade: number; // mm / decade
  tMaxTrendPerDecade: number; // °C / decade
  recentVsEarly: { rainPct: number; tMaxDelta: number }; // last 10 yrs vs first 10 yrs
  wetMonths: number[];
  dryMonths: number[];
}

function get(rec: Record<string, number> | undefined, y: number, m: number): number | null {
  const v = rec?.[`${y}${String(m).padStart(2, "0")}`];
  return v == null || v <= -990 ? null : v;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
function pct(xs: number[], p: number): number {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) return NaN;
  const i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
  return s[lo] + (s[hi] - s[lo]) * (i - lo);
}
const round = (x: number, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

function slope(xs: number[], ys: number[]): number {
  const mx = mean(xs), my = mean(ys);
  let num = 0, den = 0;
  xs.forEach((x, i) => {
    num += (x - mx) * (ys[i] - my);
    den += (x - mx) ** 2;
  });
  return den === 0 ? 0 : num / den;
}

/** Extraterrestrial radiation Ra (MJ/m²/day) for latitude and day of year — FAO-56 eq. 21. */
function extraterrestrialRadiation(latDeg: number, doy: number): number {
  const phi = (latDeg * Math.PI) / 180;
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * doy) / 365);
  const delta = 0.409 * Math.sin((2 * Math.PI * doy) / 365 - 1.39);
  const ws = Math.acos(Math.max(-1, Math.min(1, -Math.tan(phi) * Math.tan(delta))));
  return ((24 * 60) / Math.PI) * 0.082 * dr * (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws));
}

const MID_MONTH_DOY = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349];

/** Hargreaves reference evapotranspiration for a month (mm). FAO-56 eq. 52. */
export function hargreavesEt0(latDeg: number, month: number, tMean: number, tMax: number, tMin: number): number {
  const ra = extraterrestrialRadiation(latDeg, MID_MONTH_DOY[month - 1]);
  const perDay = 0.0023 * 0.408 * ra * (tMean + 17.8) * Math.sqrt(Math.max(0, tMax - tMin));
  return perDay * DAYS[month - 1];
}

/** "What if" scenario: scale rainfall by rainPct and shift temperatures by tDelta (°C). */
export function applyScenario(c: ClimateProfile, rainPct: number, tDelta: number): ClimateProfile {
  if (rainPct === 0 && tDelta === 0) return c;
  const k = 1 + rainPct / 100;
  const months = c.months.map((m) => {
    const tMean = m.tMean + tDelta, tMax = m.tMax + tDelta, tMin = m.tMin + tDelta;
    const et0Mm = Math.round(hargreavesEt0(c.lat, m.month, tMean, tMax, tMin));
    const rainMm = Math.round(m.rainMm * k);
    return {
      ...m, tMean, tMax, tMin, et0Mm, rainMm,
      rainMaxMm: Math.round(m.rainMaxMm * k), rainMinMm: Math.round(m.rainMinMm * k),
      rainP20Mm: Math.round(m.rainP20Mm * k), rainP90Mm: Math.round(m.rainP90Mm * k),
      balanceMm: rainMm - et0Mm,
    };
  });
  return { ...c, months };
}

export function buildClimateProfile(raw: PowerMonthly, lat: number, lon: number): ClimateProfile {
  const d = raw.data;
  const months: MonthNormal[] = [];
  const years: YearStat[] = [];

  for (let m = 1; m <= 12; m++) {
    const rain: number[] = [], tm: number[] = [], tx: number[] = [], tn: number[] = [], rh: number[] = [], gw: number[] = [];
    for (let y = raw.startYear; y <= raw.endYear; y++) {
      const p = get(d.PRECTOTCORR, y, m);
      if (p != null) rain.push(p * DAYS[m - 1]);
      const a = get(d.T2M, y, m); if (a != null) tm.push(a);
      const b = get(d.T2M_MAX, y, m); if (b != null) tx.push(b);
      const c = get(d.T2M_MIN, y, m); if (c != null) tn.push(c);
      const h = get(d.RH2M, y, m); if (h != null) rh.push(h);
      const g = get(d.GWETROOT, y, m); if (g != null) gw.push(g);
    }
    months.push({
      month: m,
      label: MONTH_LABELS[m - 1],
      rainMm: round(mean(rain), 0),
      rainMaxMm: round(Math.max(...rain), 0),
      rainMinMm: round(Math.min(...rain), 0),
      rainP20Mm: round(pct(rain, 0.2), 0),
      rainP90Mm: round(pct(rain, 0.9), 0),
      tMean: round(mean(tm)),
      tMax: round(mean(tx)),
      tMin: round(mean(tn)),
      rh: round(mean(rh), 0),
      soilWetness: gw.length ? round(mean(gw), 2) : null,
      et0Mm: 0,
      balanceMm: 0,
    });
    const mn = months[months.length - 1];
    mn.et0Mm = round(hargreavesEt0(lat, m, mn.tMean, mn.tMax, mn.tMin), 0);
    mn.balanceMm = mn.rainMm - mn.et0Mm;
  }

  for (let y = raw.startYear; y <= raw.endYear; y++) {
    let total = 0, ok = true;
    const tx: number[] = [];
    for (let m = 1; m <= 12; m++) {
      const p = get(d.PRECTOTCORR, y, m);
      if (p == null) { ok = false; break; }
      total += p * DAYS[m - 1];
      const t = get(d.T2M_MAX, y, m); if (t != null) tx.push(t);
    }
    if (ok) years.push({ year: y, rainMm: round(total, 0), tMax: round(mean(tx)) });
  }

  const ys = years.map((y) => y.year);
  const early = years.slice(0, 10), recent = years.slice(-10);
  const earlyRain = mean(early.map((y) => y.rainMm)), recentRain = mean(recent.map((y) => y.rainMm));

  return {
    lat, lon,
    startYear: raw.startYear,
    endYear: raw.endYear,
    source: raw.url,
    months,
    years,
    annualRainMm: round(mean(years.map((y) => y.rainMm)), 0),
    rainTrendPerDecade: round(slope(ys, years.map((y) => y.rainMm)) * 10, 0),
    tMaxTrendPerDecade: round(slope(ys, years.map((y) => y.tMax)) * 10, 2),
    recentVsEarly: {
      rainPct: round(((recentRain - earlyRain) / earlyRain) * 100),
      tMaxDelta: round(mean(recent.map((y) => y.tMax)) - mean(early.map((y) => y.tMax)), 2),
    },
    wetMonths: months.filter((m) => m.rainMm > 250).map((m) => m.month),
    dryMonths: months.filter((m) => m.rainMm < 60).map((m) => m.month),
  };
}
