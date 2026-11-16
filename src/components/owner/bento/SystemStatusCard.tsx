"use client";

export function SystemStatusCard() {
  return (
    <div className="dark-glass-card p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between min-h-[260px]">
      {/* Header */}
      <div>
        <h4 className="text-sm font-semibold text-white tracking-tight">
          System Status
        </h4>
      </div>

      {/* Meter + Horizontal Bars (Exact visual match to System Status in reference image) */}
      <div className="flex items-center justify-between gap-5 my-auto py-2">
        {/* Glowing Cyan Circle with 99% Optimal */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="systemCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#0284C7" />
                <stop offset="100%" stop-color="#38BDF8" />
              </linearGradient>
              <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="7"
            />

            {/* Glowing Active Arc */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="url(#systemCyanGrad)"
              strokeWidth="7"
              strokeDasharray={2 * Math.PI * 38}
              strokeDashoffset={(2 * Math.PI * 38) * 0.04}
              strokeLinecap="round"
              filter="url(#cyanGlow)"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-base font-black text-white">99%</span>
            <span className="text-[9px] text-slate-400">Optimal</span>
          </div>
        </div>

        {/* Right Horizontal Progress Bars */}
        <div className="flex-1 space-y-3 text-xs">
          {/* Database */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-300 mb-1">
              <span>Database</span>
              <span className="font-mono font-bold text-white">100%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full shadow-sm shadow-cyan-400/50" />
            </div>
          </div>

          {/* Realtime Stream */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-300 mb-1">
              <span>Realtime</span>
              <span className="font-mono font-bold text-white">99%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="w-[99%] h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full shadow-sm shadow-cyan-400/50" />
            </div>
          </div>

          {/* RLS Security */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-300 mb-1">
              <span>RLS Security</span>
              <span className="font-mono font-bold text-white">100%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full shadow-sm shadow-cyan-400/50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

