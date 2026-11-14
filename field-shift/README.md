# Field Shift — NASA Space Apps 2026

Decision-support tool that helps farmers explore crop rotations using NASA Earth observation data, local soil conditions, crop characteristics and their own priorities.

## Run

```bash
npm install
npm run dev
# open http://localhost:3000
```

## How it works

1. **Field**: choose one of 7 Kerala farming regions (Kuttanad, Palakkad, Onattukara, Kole, midland laterite, Wayanad, northern coast) or click anywhere on the map.
2. **NASA POWER** (`/api/climate`): fetches ~25 years of monthly temperature, bias-corrected rainfall, humidity and root-zone soil wetness, then builds a climate profile: monthly normals, wettest and driest year per month, trends, and the last 10 years compared with the first 10.
3. **Rotation engine** (`lib/rotation.ts`): scores every three-season combination of 14 Kerala crop options (about 2,700 rotations) on:
   - water saving (irrigation need after effective rainfall)
   - soil health (legumes, green manure, family diversity, rice-after-rice penalty)
   - income (market value × climate fit)
   - climate safety (flood, dry-year drought, heat and salinity risk)
   It then ranks them with the farmer's priority weights.
4. **Output**: the current rotation compared with the top 3 different options. Each strategy shows:
   - a 12-month field calendar highlighting bare months and vulnerable seasons
   - why it was suggested, benefits, evidence from NASA data, information gaps, and what to check locally
   - a score range across drier/hotter and wetter futures (uncertainty)
5. **Water balance**: monthly rain minus reference evapotranspiration (ET₀, Hargreaves / FAO-56 from NASA POWER temperatures), with root-zone soil wetness.
6. **Farmer controls**: priority sliders, crop constraints (exclude crops), and "what if" rainfall/temperature scenario sliders.
7. **Glossary**: plain-language explanations of ET, water balance, soil moisture, NDVI, satellite vs ground data, and crop roles.

## Files

- `lib/power.ts`: NASA POWER API client
- `lib/climate.ts`: climate profile and trends
- `lib/crops.ts`: crop table (edit values here)
- `lib/regions.ts`: Kerala region presets
- `lib/rotation.ts`: scoring engine
- `components/`: map, charts, rotation cards

## Data sources

- NASA POWER, https://power.larc.nasa.gov (Agroclimatology community, monthly point API)
- Crop parameters: indicative; verify with the Kerala Agricultural University Package of Practices
