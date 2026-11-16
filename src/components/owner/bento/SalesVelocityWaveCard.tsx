"use client";

export function SalesVelocityWaveCard({ activeStaffCount = 2, avgTicket = "₹750" }) {
  return (
    <div className="dark-glass-card p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between min-h-[260px]">
      {/* Header */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300">Sales Velocity</h4>
        <p className="text-base font-bold text-blue-400 mt-0.5">High Demand</p>
      </div>

      {/* Glowing Sine Waveform (Exact match to Current Mood wave in reference image) */}
      <div className="relative w-full h-20 my-auto flex items-center">
        <svg
          viewBox="0 0 300 80"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="neonWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.3" />
              <stop offset="30%" stop-color="#38BDF8" stop-opacity="1" />
              <stop offset="70%" stop-color="#818CF8" stop-opacity="1" />
              <stop offset="100%" stop-color="#F472B6" stop-opacity="0.9" />
            </linearGradient>
            <filter id="waveGlow" x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Underglow wave */}
          <path
            d="M 0,40 Q 75,10 150,40 T 300,40"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="8"
            opacity="0.3"
            filter="url(#waveGlow)"
          />

          {/* Core sharp neon wave */}
          <path
            d="M 0,40 Q 75,10 150,40 T 300,40"
            fill="none"
            stroke="url(#neonWaveGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
        <div>
          <span>Staff Active</span>{" "}
          <span className="text-emerald-400 font-semibold">{activeStaffCount} Online</span>
        </div>
        <div>
          <span>Avg. Sale</span>{" "}
          <span className="text-white font-mono font-bold">{avgTicket}</span>
        </div>
      </div>
    </div>
  );
}

