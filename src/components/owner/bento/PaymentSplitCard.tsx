"use client";

import { Play, RefreshCw, Zap } from "lucide-react";

interface PaymentSplitCardProps {
  onQuickAction?: () => void;
  cashPercent?: number;
}

export function PaymentSplitCard({ onQuickAction, cashPercent = 45 }: PaymentSplitCardProps) {
  return (
    <div className="dark-glass-card p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between items-center text-center min-h-[260px]">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between text-xs text-slate-300 font-semibold">
        <span>Ledger Velocity</span>
        <span className="text-amber-400 flex items-center gap-1 font-mono text-[10px]">
          <Zap className="w-3 h-3 fill-amber-400 text-amber-400" /> ACTIVE
        </span>
      </div>

      {/* Glowing Amber-to-Orange Circular Ring (Exact match to Focus Timer in image) */}
      <div className="relative w-36 h-36 my-2 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="timerAmberOrange" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#F59E0B" />
              <stop offset="60%" stop-color="#EF4444" />
              <stop offset="100%" stop-color="#8B5CF6" />
            </linearGradient>
            <filter id="timerGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track */}
          <circle
            cx="60"
            cy="60"
            r="48"
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.07)"
            strokeWidth="8"
          />

          {/* Glowing Arc */}
          <circle
            cx="60"
            cy="60"
            r="48"
            fill="transparent"
            stroke="url(#timerAmberOrange)"
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 48}
            strokeDashoffset={(2 * Math.PI * 48) * 0.25}
            strokeLinecap="round"
            filter="url(#timerGlow)"
          />
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white tracking-tight font-mono">
            VR 100%
          </span>
          <span className="text-[11px] text-slate-400 font-medium mt-0.5">
            Realtime
          </span>
        </div>
      </div>

      {/* Action Button: Pill shape with gradient (matches reference "▶ Start") */}
      <button
        onClick={onQuickAction}
        className="w-36 py-2 px-4 rounded-full bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 border border-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
      >
        <Play className="w-3 h-3 fill-current text-white" />
        <span>Sync Ledger</span>
      </button>
    </div>
  );
}

