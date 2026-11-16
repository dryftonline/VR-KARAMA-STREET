"use client";

import { formatINR } from "@/lib/utils/currency";
import { Profile } from "@/lib/types";

interface StaffLeaderboardCardProps {
  staffList?: Profile[];
  onViewAll?: () => void;
}

export function StaffLeaderboardCard({ staffList = [], onViewAll }: StaffLeaderboardCardProps) {
  const staffDisplay = staffList.filter((s) => s.role === "STAFF").slice(0, 3);

  // Decorative dots matching the reference image (blue, orange, green)
  const dotColors = ["bg-blue-400", "bg-amber-400", "bg-emerald-400"];

  return (
    <div className="dark-glass-card p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between min-h-[260px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <h4 className="text-sm font-semibold text-white tracking-tight">
          Staff Activity
        </h4>
        <button
          onClick={onViewAll}
          className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          View All
        </button>
      </div>

      {/* Staff Event-Style Items (Exact match to Upcoming Events in reference image) */}
      <div className="space-y-3.5 my-auto py-2">
        {staffDisplay.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No active staff roster members yet.
          </div>
        ) : (
          staffDisplay.map((st, idx) => (
            <div
              key={st.id}
              className="flex items-center justify-between gap-3 text-xs"
            >
              {/* Left Pill (e.g. "25 MAY" or "ST 01") */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center font-mono leading-tight shrink-0">
                  <span className="text-[11px] font-bold text-white">
                    0{idx + 1}
                  </span>
                  <span className="text-[8px] uppercase tracking-wider text-slate-400">
                    STF
                  </span>
                </div>

                <div>
                  <h5 className="font-semibold text-white leading-tight">
                    {st.full_name}
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {st.email || "Active on Shift"}
                  </p>
                </div>
              </div>

              {/* Status Dot (blue, orange, green) */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-emerald-400">Active</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    dotColors[idx % dotColors.length]
                  }`}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-2 text-[11px] text-slate-400 border-t border-white/5 flex items-center justify-between">
        <span>Active team roster</span>
        <span className="text-emerald-400 font-semibold">{staffDisplay.length} Online</span>
      </div>
    </div>
  );
}

