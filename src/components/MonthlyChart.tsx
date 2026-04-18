"use client";

import { useState, useRef, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface ChartDataItem {
  label: string;
  episodes: number;
  hours: number;
  count: number;
}

type ChartMode = "hours" | "episodes" | "count";

const modeConfig: Record<ChartMode, { label: string; color: string; unit: string }> = {
  hours: { label: "視聴時間", color: "#f97316", unit: "h" },
  episodes: { label: "話数", color: "#fdba74", unit: "話" },
  count: { label: "作品数", color: "#16a34a", unit: "作品" },
};

const VISIBLE_MONTHS = 8;
const BAR_WIDTH = 48;

export default function MonthlyChart({ data }: { data: ChartDataItem[] }) {
  const [mode, setMode] = useState<ChartMode>("hours");
  const config = modeConfig[mode];
  const scrollRef = useRef<HTMLDivElement>(null);

  const chartWidth = Math.max(data.length * BAR_WIDTH, VISIBLE_MONTHS * BAR_WIDTH);

  // Scroll to the right end on mount so the latest months are visible
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollLeft = el.scrollWidth - el.clientWidth;
    }
  }, [data.length]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-muted">月別グラフ</h2>
        <div className="flex gap-1">
          {(Object.keys(modeConfig) as ChartMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
                mode === m
                  ? "bg-accent/20 text-accent-light"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {modeConfig[m].label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-3">
        <div
          ref={scrollRef}
          className="overflow-x-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <BarChart
            width={chartWidth}
            height={220}
            data={data}
            margin={{ top: 5, right: 5, bottom: 5, left: -10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d8" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#8b879e", fontSize: 10 }}
              axisLine={{ stroke: "#e8e0d8" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#8b879e", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e8e0d8",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#1a1a2e",
              }}
              formatter={(value) => [
                `${value}${config.unit}`,
                config.label,
              ]}
              labelStyle={{ color: "#8b879e" }}
            />
            <Bar
              dataKey={mode}
              fill={config.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </div>
      </div>
    </div>
  );
}
