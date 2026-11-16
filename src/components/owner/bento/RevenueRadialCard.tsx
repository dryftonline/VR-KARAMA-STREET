"use client";

import { formatINR } from "@/lib/utils/currency";

interface RevenueRadialCardProps {
  totalRevenue: number;
  cashSales: number;
  upiSales: number;
  cashCount: number;
  upiCount: number;
  totalTransactions: number;
}

export function RevenueRadialCard({
  totalRevenue = 0,
  cashSales = 0,
  upiSales = 0,
  cashCount = 0,
  upiCount = 0,
  totalTransactions = 0,
}: RevenueRadialCardProps) {
  // Calculate percentage of UPI vs Cash
  const upiPercent = totalRevenue > 0 ? Math.round((upiSales / totalRevenue) * 100) : 50;
  const circumference = 2 * Math.PI * 42; // r = 42
  const strokeDashoffset = circumference - (upiPercent / 100) * circumference;

  return (
    <div className="dark-glass-card p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between min-h-[260px]">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-300">Total Revenue</h4>
        <span className="text-xs text-slate-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
          Today ▾
        </span>
      </div>

      {/* Center Content: Big Stat + Glowing Circular Progress Ring */}
      <div className="flex items-center justify-between gap-4 my-auto py-2">
        <div className="space-y-1">
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight tabular-nums">
            {formatINR(totalRevenue, false)}
          </div>
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
            <span>Great Progress!</span>
          </div>
        </div>

        {/* Glowing Donut Ring SVG */}
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="radialCyanPurple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#06B6D4" />
                <stop offset="50%" stop-color="#3B82F6" />
                <stop offset="100%" stop-color="#A855F7" />
              </linearGradient>
              <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
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
              r="40"
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="9"
            />

            {/* Glowing Active Progress Arc */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="url(#radialCyanPurple)"
              strokeWidth="9"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={(2 * Math.PI * 40) * (1 - (upiPercent / 100))}
              strokeLinecap="round"
              filter="url(#ringGlow)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center inner text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-black text-white">{upiPercent}%</span>
            <span className="text-[9px] text-slate-400 uppercase">UPI</span>
          </div>
        </div>
      </div>

      {/* Bottom Metrics: Cash vs UPI Breakdown */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5 text-xs">
        <div>
          <div className="text-slate-400 text-[11px]">Cash Sales</div>
          <div className="text-base font-bold text-white mt-0.5 tabular-nums">
            {formatINR(cashSales, false)}
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">
            {cashCount} transactions
          </div>
        </div>

        <div>
          <div className="text-slate-400 text-[11px]">UPI Sales</div>
          <div className="text-base font-bold text-white mt-0.5 tabular-nums">
            {formatINR(upiSales, false)}
          </div>
          <div className="text-[10px] text-purple-400 font-medium">
            {upiCount} transactions
          </div>
        </div>
      </div>
    </div>
  );
}

