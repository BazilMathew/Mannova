import { NextResponse } from "next/server";
import { SAT_LAYERS, wmsProbeUrl } from "@/lib/gibs";

export const maxDuration = 30;

type Resolved = { key: string; id: string | null };
let cache: { at: number; layers: Resolved[] } | null = null;
const DAY = 24 * 60 * 60 * 1000;

async function works(id: string): Promise<boolean> {
  try {
    const res = await fetch(wmsProbeUrl(id), { cache: "no-store", signal: AbortSignal.timeout(12_000) });
    // GIBS answers an unknown layer with an XML ServiceException instead of an image.
    return res.ok && (res.headers.get("content-type") ?? "").startsWith("image/");
  } catch {
    return false;
  }
}

/** Finds which GIBS layer identifiers are live, trying each layer's candidates in order. */
export async function GET() {
  if (cache && Date.now() - cache.at < DAY) return NextResponse.json({ layers: cache.layers, cached: true });
  const layers = await Promise.all(
    SAT_LAYERS.map(async (l): Promise<Resolved> => {
      for (const id of l.candidates) if (await works(id)) return { key: l.key, id };
      return { key: l.key, id: null };
    }),
  );
  if (layers.some((l) => l.id)) cache = { at: Date.now(), layers };
  return NextResponse.json({ layers, cached: false });
}
