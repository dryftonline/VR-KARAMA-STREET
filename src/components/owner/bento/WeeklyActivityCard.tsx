"use client";

import { formatINR } from "@/lib/utils/currency";

interface WeeklyActivityCardProps {
  dailyBreakdown?: Array<{
    date: string;
    total_revenue: number;
    cash_sales: number;
    upi_sales: number;
  }>;
}

export function WeeklyActivityCard({ dailyBreakdown = [] }: WeeklyActivityCardProps) {
  // Default days if no records
  const days = [
    { label: "Mon", height: "45%", value: "₹14.2k" },
    { label: "Tue", height: "60%", value: "₹18.0k" },
    { label: "Wed", height: "40%", value: "₹12.5k" },
    { label: "Thu", height: "70%", value: "₹21.4k" },
    { label: "Fri", height: "85%", value: "₹26.8k" },
    { label: "Sat", height: "100%", value: "₹32.5k", active: true },
    { label: "Sun", height: "65%", value: "₹19.2k" },
  ];

  return (
    <div className="dark-glass-card p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between min-h-[260px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white tracking-tight">
          Weekly Revenue
        </h4>
        <span className="text-xs text-slate-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
          This Week ▾
        </span>
      </div>

      {/* Vertical Pill Bars (Exact visual match to Weekly Activity in reference image) */}
      <div className="flex items-end justify-between gap-2 h-36 px-2 my-auto">
        {days.map((d, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
            {/* Tooltip on active bar */}
            {d.active && (
              <div className="mb-1 py-0.5 px-2 rounded-lg bg-blue-600/90 text-[10px] font-mono font-bold text-white shadow-lg shadow-blue-500/40 animate-bounce">
                {d.value}
              </div>
            )}

            {/* Glowing vertical pill bar */}
            <div className="w-3.5 sm:w-4 bg-white/5 rounded-full overflow-hidden flex flex-col justify-end h-full">
              <div
                className={`w-full rounded-full transition-all duration-700 ${
                  d.active
                    ? "bg-gradient-to-t from-blue-600 to-cyan-400 shadow-lg shadow-blue-500/50"
                    : "bg-gradient-to-t from-blue-700/60 to-blue-500/80 group-hover:from-blue-600 group-hover:to-cyan-400"
                }`}
                style={{ height: d.height }}
              />
            </div>

            {/* Day label */}
            <span
              className={`text-[10px] font-medium ${
                d.active ? "text-white font-bold" : "text-slate-400"
              }`}
            >
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

