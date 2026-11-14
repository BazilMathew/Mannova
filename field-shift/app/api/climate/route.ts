import { NextRequest, NextResponse } from "next/server";
import { fetchPowerMonthly } from "@/lib/power";
import { buildClimateProfile, type ClimateProfile } from "@/lib/climate";

export const maxDuration = 60;

const cache = new Map<string, ClimateProfile>();

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "Invalid lat/lon" }, { status: 400 });
  }
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit) return NextResponse.json(hit);

  try {
    const raw = await fetchPowerMonthly(lat, lon);
    const profile = buildClimateProfile(raw, lat, lon);
    cache.set(key, profile);
    return NextResponse.json(profile);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "NASA POWER request failed" }, { status: 502 });
  }
}
