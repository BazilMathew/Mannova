// Indicative crop characteristics for seasonal crops grown across Kerala (wetlands, uplands, high ranges).
// Values are approximate and meant for comparison, not prescription.
// TODO: verify against the Kerala Agricultural University (KAU) Package of Practices.

export interface Crop {
  id: string;
  name: string;
  ml: string; // Malayalam name
  family: string;
  durationDays: number;
  waterMm: number; // seasonal crop water requirement
  tMaxRange: [number, number]; // comfortable range of mean daily max temperature (°C)
  floodTol: number; // 0 (none) – 1 (high): tolerance of waterlogging / submergence
  salinityTol: number; // 0 – 1
  legume: boolean;
  greenManure: boolean;
  incomeIdx: number; // 0 – 1, relative market value per season
  roles?: Role[];
}

export type Role = "Nitrogen-fixing" | "Cover crop" | "Deep-rooting" | "Drought-tolerant" | "Cash crop" | "Short-duration" | "Staple";

// Plain-language explanations shown to farmers.
export const ROLE_INFO: Record<Role, string> = {
  "Nitrogen-fixing": "Root nodules hold bacteria that pull nitrogen from the air into the soil, so the next crop needs less urea.",
  "Cover crop": "Keeps the ground covered, protecting soil from heavy rain, erosion and weeds, and adds organic matter.",
  "Deep-rooting": "Long roots break up compacted layers, improve infiltration and bring up nutrients from deeper soil.",
  "Drought-tolerant": "Can finish its season on stored soil moisture and little rain, reducing irrigation needs.",
  "Cash crop": "Usually sells well in local markets, adding income between staple crops.",
  "Short-duration": "Fits into a short gap between main crops.",
  Staple: "Main food crop with an assured market and procurement support.",
};

export const CROPS: Crop[] = [
  { id: "rice", name: "Rice", ml: "നെല്ല്", family: "Poaceae", durationDays: 120, waterMm: 1200, tMaxRange: [25, 35], floodTol: 0.85, salinityTol: 0.35, legume: false, greenManure: false, incomeIdx: 0.6, roles: ["Staple"] },
  { id: "cowpea", name: "Cowpea", ml: "വൻപയർ", family: "Fabaceae", durationDays: 75, waterMm: 350, tMaxRange: [24, 35], floodTol: 0.15, salinityTol: 0.3, legume: true, greenManure: false, incomeIdx: 0.55, roles: ["Nitrogen-fixing", "Cover crop", "Drought-tolerant"] },
  { id: "greengram", name: "Green gram", ml: "ചെറുപയർ", family: "Fabaceae", durationDays: 70, waterMm: 300, tMaxRange: [25, 36], floodTol: 0.1, salinityTol: 0.25, legume: true, greenManure: false, incomeIdx: 0.5, roles: ["Nitrogen-fixing", "Short-duration", "Drought-tolerant"] },
  { id: "sesame", name: "Sesame", ml: "എള്ള്", family: "Pedaliaceae", durationDays: 85, waterMm: 350, tMaxRange: [25, 37], floodTol: 0.05, salinityTol: 0.3, legume: false, greenManure: false, incomeIdx: 0.6, roles: ["Deep-rooting", "Drought-tolerant", "Cash crop"] },
  { id: "okra", name: "Okra", ml: "വെണ്ട", family: "Malvaceae", durationDays: 100, waterMm: 500, tMaxRange: [24, 36], floodTol: 0.15, salinityTol: 0.35, legume: false, greenManure: false, incomeIdx: 0.75, roles: ["Cash crop"] },
  { id: "amaranthus", name: "Amaranthus", ml: "ചീര", family: "Amaranthaceae", durationDays: 40, waterMm: 300, tMaxRange: [22, 36], floodTol: 0.2, salinityTol: 0.45, legume: false, greenManure: false, incomeIdx: 0.55, roles: ["Short-duration", "Cash crop"] },
  { id: "bittergourd", name: "Bitter gourd", ml: "പാവൽ", family: "Cucurbitaceae", durationDays: 120, waterMm: 500, tMaxRange: [24, 35], floodTol: 0.1, salinityTol: 0.3, legume: false, greenManure: false, incomeIdx: 0.8, roles: ["Cash crop"] },
  { id: "sunhemp", name: "Sunhemp (green manure)", ml: "ചണമ്പ്", family: "Fabaceae", durationDays: 50, waterMm: 250, tMaxRange: [24, 37], floodTol: 0.4, salinityTol: 0.4, legume: true, greenManure: true, incomeIdx: 0.1, roles: ["Nitrogen-fixing", "Cover crop", "Deep-rooting"] },
  { id: "groundnut", name: "Groundnut", ml: "നിലക്കടല", family: "Fabaceae", durationDays: 110, waterMm: 450, tMaxRange: [25, 35], floodTol: 0.05, salinityTol: 0.3, legume: true, greenManure: false, incomeIdx: 0.7, roles: ["Nitrogen-fixing", "Cash crop"] },
  { id: "blackgram", name: "Black gram", ml: "ഉഴുന്ന്", family: "Fabaceae", durationDays: 75, waterMm: 300, tMaxRange: [25, 36], floodTol: 0.1, salinityTol: 0.25, legume: true, greenManure: false, incomeIdx: 0.55, roles: ["Nitrogen-fixing", "Short-duration"] },
  { id: "horsegram", name: "Horse gram", ml: "മുതിര", family: "Fabaceae", durationDays: 100, waterMm: 250, tMaxRange: [24, 38], floodTol: 0.05, salinityTol: 0.3, legume: true, greenManure: false, incomeIdx: 0.4, roles: ["Nitrogen-fixing", "Drought-tolerant", "Deep-rooting"] },
  { id: "sweetpotato", name: "Sweet potato", ml: "മധുരക്കിഴങ്ങ്", family: "Convolvulaceae", durationDays: 110, waterMm: 450, tMaxRange: [22, 34], floodTol: 0.1, salinityTol: 0.35, legume: false, greenManure: false, incomeIdx: 0.6, roles: ["Cover crop", "Drought-tolerant"] },
  { id: "cabbage", name: "Cabbage", ml: "കാബേജ്", family: "Brassicaceae", durationDays: 100, waterMm: 400, tMaxRange: [15, 27], floodTol: 0.1, salinityTol: 0.3, legume: false, greenManure: false, incomeIdx: 0.75, roles: ["Cash crop"] },
  { id: "fallow", name: "Fallow", ml: "തരിശ്", family: "—", durationDays: 0, waterMm: 0, tMaxRange: [0, 99], floodTol: 1, salinityTol: 1, legume: false, greenManure: false, incomeIdx: 0 },
];

export const CROP_BY_ID: Record<string, Crop> = Object.fromEntries(CROPS.map((c) => [c.id, c]));
