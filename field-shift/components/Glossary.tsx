import { ROLE_INFO, type Role } from "@/lib/crops";

const TERMS: [string, string][] = [
  ["Evapotranspiration (ET₀)", "Water that leaves the field as evaporation from soil plus transpiration from plants. ET₀ is the demand of a reference grass crop; we estimate it from NASA POWER temperatures with the Hargreaves method (FAO-56). When rain is lower than ET₀, crops draw on stored soil water or irrigation."],
  ["Water balance", "Rain minus ET₀ for each month. Positive means surplus (runoff, drainage, flooding risk); negative means deficit (water stress unless irrigated)."],
  ["Root-zone soil wetness", "NASA POWER's estimate of how wet the soil is in the root zone, from 0 (dry) to 1 (saturated). It comes from NASA's MERRA-2 model, which assimilates satellite and ground observations."],
  ["1-in-5 dry year / 1-in-10 wet year", "From 25 years of records: the 20th-percentile rainfall (dry enough to happen about once every five years) and 90th-percentile rainfall (wet enough to happen about once every ten years). We use them to test each crop against bad years, not just average ones."],
  ["Soil moisture anomaly", "How much wetter or drier the soil is than normal for that time of year. Satellites such as NASA SMAP measure surface soil moisture every 2–3 days."],
  ["NDVI (vegetation index)", "A satellite measure of green, healthy vegetation from MODIS or Landsat. Low NDVI during a growing season can signal crop stress; very low values show bare ground."],
  ["Satellite vs ground data", "Satellites and models such as NASA POWER cover every farm consistently but at a coarse scale (about 50 km for POWER). Rain gauges and soil tests are exact for one spot. Combining both gives the most reliable picture, so check these results against your own records."],
];

export default function Glossary() {
  return (
    <details className="card glossary accordion">
      <summary><h2>Understanding the results</h2><span>Terms, crop roles and how scores work</span></summary>
      <dl>
        {TERMS.map(([t, d]) => (
          <div key={t}><dt>{t}</dt><dd>{d}</dd></div>
        ))}
      </dl>
      <h3>How rotation crops help soil</h3>
      <dl>
        {(Object.keys(ROLE_INFO) as Role[]).map((r) => (
          <div key={r}><dt>{r}</dt><dd>{ROLE_INFO[r]}</dd></div>
        ))}
      </dl>
      <h3>How scores are calculated</h3>
      <p className="muted">
        Every possible three-season rotation is checked season by season against NASA climate records for your location: rain and evaporative demand while the crop is in the field,
        dry-year shortfall, wet-year waterlogging, heat, and salinity. Soil health rewards legumes, cover crops, deep roots and crop-family diversity, and penalises bare months and
        repeating the same crop or family. The overall score weights water, soil, income and climate safety by your sliders. The range shows how much the score moves in a drier, hotter
        future (−15% rain, +0.5 °C) and a wetter one (+15% rain).
      </p>
      <p className="note">
        This tool helps you spot patterns and possibilities. It does not replace your own experience or advice from your Krishi Bhavan or agricultural officer, especially on
        varieties, sowing dates, pest control and markets.
      </p>
    </details>
  );
}
