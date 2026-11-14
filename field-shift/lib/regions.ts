import type { FarmInputs } from "./rotation";

// Sample farming regions across Kerala. Selecting one moves the map and pre-fills typical conditions;
// the farmer can then adjust every input. Values are typical, not field-specific.
export interface Region {
  id: string;
  name: string;
  district: string;
  lat: number;
  lon: number;
  blurb: string;
  defaults: Omit<FarmInputs, "priorities">;
}

export const REGIONS: Region[] = [
  {
    id: "kuttanad", name: "Kuttanad wetlands", district: "Alappuzha", lat: 9.3667, lon: 76.4667,
    blurb: "Below-sea-level paddy; monsoon floods and summer saltwater intrusion.",
    defaults: { soilTexture: "clay", drainage: "poor", salinity: "seasonal", irrigation: "limited", current: ["rice", "rice", "fallow"] },
  },
  {
    id: "palakkad", name: "Palakkad plains", district: "Palakkad", lat: 10.7, lon: 76.74,
    blurb: "Kerala's rice bowl; drier, hotter rain-shadow belt near the Palakkad Gap.",
    defaults: { soilTexture: "loam", drainage: "good", salinity: "none", irrigation: "limited", current: ["rice", "rice", "fallow"] },
  },
  {
    id: "onattukara", name: "Onattukara sandy coast", district: "Alappuzha / Kollam", lat: 9.17, lon: 76.5,
    blurb: "Sandy coastal soils that drain fast; rice followed by sesame is traditional.",
    defaults: { soilTexture: "sandy", drainage: "good", salinity: "none", irrigation: "limited", current: ["rice", "rice", "sesame"] },
  },
  {
    id: "kole", name: "Kole lands", district: "Thrissur / Malappuram", lat: 10.5, lon: 76.1,
    blurb: "Low-lying fields that stay flooded through the monsoon; rice after the water drains.",
    defaults: { soilTexture: "clay", drainage: "poor", salinity: "seasonal", irrigation: "limited", current: ["fallow", "rice", "fallow"] },
  },
  {
    id: "midland", name: "Midland laterite uplands", district: "Kollam / Kottayam", lat: 9.0, lon: 76.77,
    blurb: "Rolling laterite hills; rain-fed vegetables and pulses between plantation crops.",
    defaults: { soilTexture: "laterite", drainage: "good", salinity: "none", irrigation: "none", current: ["okra", "cowpea", "fallow"] },
  },
  {
    id: "wayanad", name: "Wayanad high range", district: "Wayanad", lat: 11.66, lon: 76.26,
    blurb: "Cooler highland valleys; paddy and vegetables at ~700–900 m.",
    defaults: { soilTexture: "loam", drainage: "moderate", salinity: "none", irrigation: "limited", current: ["rice", "fallow", "fallow"] },
  },
  {
    id: "kasaragod", name: "Northern laterite coast", district: "Kasaragod / Kannur", lat: 12.25, lon: 75.13,
    blurb: "Very heavy monsoon on laterite; long dry summer.",
    defaults: { soilTexture: "laterite", drainage: "moderate", salinity: "none", irrigation: "limited", current: ["rice", "fallow", "fallow"] },
  },
];

// Rough bounding box for Kerala — used to warn when a point is outside the region the crop data is tuned for.
export const inKerala = (lat: number, lon: number) => lat >= 8.15 && lat <= 12.85 && lon >= 74.8 && lon <= 77.45;
