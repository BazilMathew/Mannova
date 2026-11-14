"use client";

import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ClimateProfile } from "@/lib/climate";

export default function ClimateCharts({ c }: { c: ClimateProfile }) {
  const sign = (x: number) => (x > 0 ? "+" : "");
  return (
    <section className="card">
      <h2>Climate profile</h2>
      <p className="muted">Monthly averages from NASA POWER, {c.startYear}–{c.endYear}.</p>

      <h3>Monthly rainfall and temperature</h3>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={c.months}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7ebe4" />
          <XAxis dataKey="label" />
          <YAxis yAxisId="r" unit=" mm" width={72} />
          <YAxis yAxisId="t" orientation="right" unit="°C" domain={["dataMin - 2", "dataMax + 2"]} width={58} tickFormatter={(v: number) => v.toFixed(0)} />
          <Tooltip />
          <Legend />
          <Bar yAxisId="r" dataKey="rainMm" name="Avg rainfall" fill="#3b82f6" />
          <Bar yAxisId="r" dataKey="rainMaxMm" name="Wettest year" fill="#93c5fd" />
          <Line yAxisId="t" dataKey="tMax" name="Avg max temp" stroke="#dc2626" dot={false} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>

      <h3>Water balance: rain minus evaporative demand (ET₀)</h3>
      <ResponsiveContainer width="100%" height={230}>
        <ComposedChart data={c.months}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7ebe4" />
          <XAxis dataKey="label" />
          <YAxis yAxisId="b" unit=" mm" width={72} />
          <YAxis yAxisId="w" orientation="right" domain={[0, 1]} width={45} />
          <Tooltip />
          <Legend />
          <ReferenceLine yAxisId="b" y={0} stroke="#6b7280" />
          <Bar yAxisId="b" dataKey="balanceMm" name="Rain − ET₀ (blue surplus / orange deficit)" fill="#3b82f6">
            {c.months.map((m) => <Cell key={m.month} fill={m.balanceMm >= 0 ? "#3b82f6" : "#f97316"} />)}
          </Bar>
          <Line yAxisId="w" dataKey="soilWetness" name="Root-zone soil wetness (0–1)" stroke="#7c3aed" dot={false} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="muted">
        Orange months lose more water to evaporation and plant transpiration than rain supplies: the stretch where crops depend on stored soil water or irrigation.
        Deficit months: {c.months.filter((m) => m.balanceMm < 0).map((m) => m.label).join(", ") || "none"}.
      </p>

      <h3>Annual rainfall over time</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={c.years}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7ebe4" />
          <XAxis dataKey="year" />
          <YAxis unit=" mm" width={70} />
          <Tooltip />
          <Line dataKey="rainMm" name="Annual rainfall" stroke="#1f7a4d" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
      <p className="muted">
        Trend: {sign(c.rainTrendPerDecade)}{c.rainTrendPerDecade} mm per decade, {sign(c.tMaxTrendPerDecade)}{c.tMaxTrendPerDecade} °C per decade in max temperature.
      </p>
    </section>
  );
}
