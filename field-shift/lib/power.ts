// NASA POWER (Prediction Of Worldwide Energy Resources) — monthly point API, Agroclimatology community.
// Docs: https://power.larc.nasa.gov/docs/services/api/temporal/monthly/

export const POWER_PARAMS = [
  "T2M", // mean air temperature at 2 m (°C)
  "T2M_MAX", // max temperature at 2 m (°C)
  "T2M_MIN", // min temperature at 2 m (°C)
  "PRECTOTCORR", // precipitation, bias-corrected (mm/day, monthly mean)
  "RH2M", // relative humidity at 2 m (%)
  "GWETROOT", // root-zone soil wetness (0–1)
] as const;

export type PowerParam = (typeof POWER_PARAMS)[number];

export interface PowerMonthly {
  startYear: number;
  endYear: number;
  url: string;
  data: Record<PowerParam, Record<string, number>>;
}

export async function fetchPowerMonthly(lat: number, lon: number): Promise<PowerMonthly> {
  const thisYear = new Date().getFullYear();
  const startYear = thisYear - 25;
  // Monthly data for the current year isn't complete; try last year, then the year before.
  for (const endYear of [thisYear - 1, thisYear - 2]) {
    const url =
      `https://power.larc.nasa.gov/api/temporal/monthly/point` +
      `?parameters=${POWER_PARAMS.join(",")}&community=AG` +
      `&longitude=${lon.toFixed(4)}&latitude=${lat.toFixed(4)}` +
      `&start=${startYear}&end=${endYear}&format=JSON`;
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(90_000) });
    if (res.ok) {
      const json = await res.json();
      return { startYear, endYear, url, data: json.properties.parameter };
    }
    if (res.status !== 422 && res.status !== 400) {
      throw new Error(`NASA POWER returned HTTP ${res.status}`);
    }
  }
  throw new Error("NASA POWER: no complete date range available");
}
