"use client";

import { useEffect, useState } from "react";
import { formatTimeIST } from "@/lib/utils/timezone";

interface HeroGreetingCardProps {
  fullName?: string;
  totalTransactions?: number;
}

export function HeroGreetingCard({ fullName = "Aaru", totalTransactions = 0 }: HeroGreetingCardProps) {
  const [timeStr, setTimeStr] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("Good Evening,");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(formatTimeIST(now));
      
      const hour = now.getHours();
      if (hour < 12) setGreeting("Good Morning,");
      else if (hour < 17) setGreeting("Good Afternoon,");
      else setGreeting("Good Evening,");
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dark-glass-card p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between min-h-[220px] group">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <span className="text-xs text-slate-400 font-medium tracking-wide">
            {greeting}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            {fullName || "VR Street Karama"}
          </h2>
          <p className="text-xs text-slate-400/90 mt-1">
            Stay focused and make it happen. Shared sales ledger live.
          </p>
        </div>

        {/* Time Pill */}
        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-medium text-slate-200 tabular-nums shadow-inner">
          {timeStr || "07:45 PM"}
        </div>
      </div>

      {/* Glowing Neon Blue Spline Line (Exact visual match to reference image) */}
      <div className="relative w-full h-16 mt-4">
        <svg
          viewBox="0 0 400 60"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="neonSplineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.2" />
              <stop offset="40%" stop-color="#60A5FA" stop-opacity="1" />
              <stop offset="70%" stop-color="#93C5FD" stop-opacity="0.9" />
              <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.4" />
            </linearGradient>
            <filter id="splineGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Underglow curve */}
          <path
            d="M 0,45 Q 60,42 100,35 T 180,38 T 240,20 T 300,12 T 360,28 T 400,22"
            fill="none"
            stroke="#2563EB"
            strokeWidth="6"
            opacity="0.4"
            filter="url(#splineGlowFilter)"
          />

          {/* Main glowing neon curve */}
          <path
            d="M 0,45 Q 60,42 100,35 T 180,38 T 240,20 T 300,12 T 360,28 T 400,22"
            fill="none"
            stroke="url(#neonSplineGlow)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Glowing node dots */}
          <circle cx="100" cy="35" r="3.5" fill="#60A5FA" filter="url(#splineGlowFilter)" />
          <circle cx="180" cy="38" r="3" fill="#93C5FD" />
          <circle cx="240" cy="20" r="4" fill="#FFFFFF" filter="url(#splineGlowFilter)" />
          <circle cx="300" cy="12" r="4.5" fill="#BFDBFE" filter="url(#splineGlowFilter)" />
          <circle cx="360" cy="28" r="3.5" fill="#60A5FA" />
        </svg>
      </div>
    </div>
  );
}

