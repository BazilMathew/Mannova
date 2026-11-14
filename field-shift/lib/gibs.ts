// NASA GIBS (Global Imagery Browse Services) — free, no login. We use its WMS endpoint in Web Mercator,
// which Leaflet supports directly, so no tile-matrix-set guesswork is needed.
// Docs: https://nasa-gibs.github.io/gibs-api-docs/

export const GIBS_WMS = "https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi";

export interface SatLayerDef {
  key: string;
  name: string;
  mission: string;
  cadence: string;
  resolution: string;
  candidates: string[]; // GIBS layer identifiers to try, best first
  why: string; // why it matters for crop rotation
  legend: { colors: string[]; low: string; high: string };
}

export const SAT_LAYERS: SatLayerDef[] = [
  {
    key: "ndvi",
    name: "Vegetation health",
    mission: "MODIS NDVI (Terra)",
    cadence: "8-day composite",
    resolution: "about 250 m",
    candidates: ["MODIS_Terra_NDVI_8Day", "MODIS_Aqua_NDVI_8Day", "MODIS_Terra_L3_NDVI_16Day", "MODIS_Terra_L3_NDVI_Monthly"],
    why: "Brown or pale areas in cropland show bare or stressed fields: the gaps a rotation crop could fill. Green shows active crops.",
    legend: { colors: ["#a16207", "#d9c27a", "#a3d977", "#3f9b3a", "#0b5d1e"], low: "Bare / stressed", high: "Dense, healthy" },
  },
  {
    key: "soil",
    name: "Soil moisture",
    mission: "SMAP L4 root zone",
    cadence: "Daily",
    resolution: "about 9 km grid cells",
    candidates: ["SMAP_L4_Analyzed_Root_Zone_Soil_Moisture", "SMAP_L4_Analyzed_Surface_Soil_Moisture", "SMAP_L3_Passive_Enhanced_Day_Soil_Moisture"],
    why: "How much water is held where roots grow. Dry zones favour drought-tolerant pulses; saturated zones favour rice.",
    legend: { colors: ["#f2e74b", "#9acd32", "#2e8b57", "#40e0d0", "#1e90ff", "#1a3fbf"], low: "Dry", high: "Wet" },
  },
  {
    key: "rain",
    name: "Rainfall",
    mission: "GPM IMERG",
    cadence: "Latest 30 min",
    resolution: "about 10 km grid cells",
    candidates: ["IMERG_Precipitation_Rate", "IMERG_Precipitation_Rate_30min", "IMERG_Rain_Rate"],
    why: "Where rain is falling now, from the Global Precipitation Measurement constellation. Heavy bands flag waterlogging risk.",
    legend: { colors: ["#c6dbef", "#6baed6", "#2171b5", "#f59e0b", "#dc2626"], low: "Light", high: "Heavy" },
  },
  {
    key: "lst",
    name: "Land surface heat",
    mission: "MODIS LST (Terra, day)",
    cadence: "Daily",
    resolution: "about 1 km",
    candidates: ["MODIS_Terra_Land_Surface_Temp_Day", "MODIS_Terra_L3_Land_Surface_Temp_Daily_Day", "MODIS_Aqua_Land_Surface_Temp_Day"],
    why: "Daytime ground temperature. Hot spots show where heat stress hits crops and soil dries fastest.",
    legend: { colors: ["#313695", "#74add1", "#ffffbf", "#f46d43", "#a50026"], low: "Cool", high: "Hot" },
  },
  {
    key: "truecolor",
    name: "True colour",
    mission: "MODIS Corrected Reflectance",
    cadence: "Daily",
    resolution: "about 250 m",
    candidates: ["MODIS_Terra_CorrectedReflectance_TrueColor", "VIIRS_SNPP_CorrectedReflectance_TrueColor"],
    why: "The satellite photo of the day: clouds, rivers, backwaters and the green of paddy fields.",
    legend: { colors: [], low: "", high: "" },
  },
];

// A small box over Kerala in Web Mercator metres, used to test which layer names respond.
export const KERALA_BBOX_3857 = "8350000,950000,8600000,1200000";

export function wmsProbeUrl(layer: string) {
  const q = new URLSearchParams({
    SERVICE: "WMS", REQUEST: "GetMap", VERSION: "1.3.0", LAYERS: layer, STYLES: "", CRS: "EPSG:3857",
    BBOX: KERALA_BBOX_3857, WIDTH: "32", HEIGHT: "32", FORMAT: "image/png", TRANSPARENT: "true",
  });
  return `${GIBS_WMS}?${q.toString()}`;
}
