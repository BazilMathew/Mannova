import { MONTH_LABELS } from "@/lib/climate";
import type { RotationResult } from "@/lib/rotation";

export const CROP_COLORS: Record<string, string> = {
  rice: "#65a30d", cowpea: "#d97706", greengram: "#16a34a", sesame: "#8b5cf6", okra: "#0d9488", amaranthus: "#db2777",
  bittergourd: "#0284c7", sunhemp: "#ca8a04", groundnut: "#c2410c", blackgram: "#475569", horsegram: "#92400e",
  sweetpotato: "#9333ea", cabbage: "#059669",
};

export default function FieldCalendar({ r, showLabels = false }: { r: RotationResult; showLabels?: boolean }) {
  return (
    <div className="calendar" aria-label="12-month field calendar">
      {r.calendar.map((m) => (
        <div
          key={m.month}
          className={`cal ${m.crop ? "" : "bare"} ${m.vulnerable ? "vuln" : ""}`}
          style={m.crop ? { background: CROP_COLORS[m.crop.id] ?? "#94a3b8" } : undefined}
          title={`${MONTH_LABELS[m.month - 1]}: ${m.crop ? m.crop.name : "bare / fallow"}${m.vulnerable ? " (vulnerable)" : ""}`}
        >
          <span>{showLabels ? MONTH_LABELS[m.month - 1] : MONTH_LABELS[m.month - 1][0]}</span>
        </div>
      ))}
    </div>
  );
}
