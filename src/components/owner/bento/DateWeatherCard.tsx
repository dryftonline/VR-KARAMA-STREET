"use client";

import { useEffect, useState } from "react";
import { formatDateIST } from "@/lib/utils/timezone";

export function DateWeatherCard() {
  const [dateStr, setDateStr] = useState<string>("May 24, 2025");
  const [dayName, setDayName] = useState<string>("Saturday");

  useEffect(() => {
    const now = new Date();
    setDateStr(formatDateIST(now));
    setDayName(now.toLocaleDateString("en-US", { weekday: "long" }));
  }, []);

  return (
    <div className="dark-glass-card p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
      {/* Top Date Header */}
      <div>
        <h3 className="text-base font-bold text-white tracking-tight">
          {dateStr}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">{dayName}</p>
      </div>

      {/* Weather & Temperature Display (Exact match to reference) */}
      <div className="flex items-center gap-4 my-auto pt-2">
        {/* Glowing Sun + Cloud SVG Icon */}
        <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
          {/* Sun glowing orb behind cloud */}
          <div className="absolute top-1 right-2 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-lg shadow-amber-500/50 animate-pulse-subtle" />
          
          {/* Cloud SVG in front */}
          <svg
            className="relative z-10 w-11 h-11 text-slate-100 drop-shadow-md"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          </svg>
        </div>

        <div>
          <div className="text-3xl font-black text-white tracking-tight">
            27°
          </div>
          <div className="text-xs text-slate-400 font-medium">Cloudy • Karama</div>
        </div>
      </div>

      {/* High / Low Range */}
      <div className="flex items-center gap-3 text-xs text-slate-400 font-medium pt-1">
        <span>H: 31°</span>
        <span>L: 21°</span>
        <span className="text-emerald-400 text-[11px] ml-auto font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Store Online
        </span>
      </div>
    </div>
  );
}

