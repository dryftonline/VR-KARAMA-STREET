"use client";

import { AlertCircle, Calendar, Clock, ArrowUpRight, ShieldCheck, Check } from "lucide-react";
import { formatINR } from "@/lib/utils/currency";

interface FinnovaKpiCardsProps {
  totalRevenue: number;
  cashSales: number;
  upiSales: number;
  totalTransactions: number;
  cashCount: number;
  upiCount: number;
  onRecordSaleClick?: () => void;
}

export function FinnovaKpiCards({
  totalRevenue = 0,
  cashSales = 0,
  upiSales = 0,
  totalTransactions = 0,
  cashCount = 0,
  upiCount = 0,
  onRecordSaleClick,
}: FinnovaKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* CARD 1: Total Revenue (Matches Overdue card in reference) */}
      <div className="finnova-card p-6 flex flex-col justify-between min-h-[220px]">
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Revenue</span>
            <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#5850EC]">
              <span className="text-[10px] font-bold">₹</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2.5 tabular-nums">
            {formatINR(totalRevenue)}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
            <span>{totalTransactions > 0 ? `${totalTransactions} sales recorded` : "Active ledger"}</span>
            <span className="text-slate-400 font-normal">today</span>
          </div>
        </div>

        {/* Decorative mini workspace / desk graphic matching reference */}
        <div className="pt-4 flex items-center gap-3">
          <div className="h-10 w-full rounded-xl bg-gradient-to-r from-slate-50 to-indigo-50/50 border border-slate-100 flex items-center px-3 justify-between text-[11px] text-slate-500">
            <span>Daily Ledger</span>
            <span className="font-bold text-[#5850EC]">{totalTransactions} Sales</span>
          </div>
        </div>
      </div>

      {/* CARD 2: Cash Sales (Matches Due within next month + vertical bars in reference) */}
      <div className="finnova-card p-6 flex flex-col justify-between min-h-[220px]">
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Cash Sales</span>
            <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
              <Calendar className="w-3 h-3 text-[#5850EC]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2.5 tabular-nums">
            {formatINR(cashSales)}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
            <span>{cashCount} cash payments</span>
            <span className="text-slate-400 font-normal">received</span>
          </div>
        </div>

        {/* Vertical Lavender/Indigo Bar Chart (Exact match to reference image) */}
        <div className="pt-2">
          <div className="flex items-end justify-between gap-1.5 h-12 px-1">
            {[35, 50, 40, 65, 80, 100].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div
                  className={`w-full rounded-md transition-all ${
                    i === 5
                      ? "bg-gradient-to-t from-[#4F46E5] to-[#7C3AED]"
                      : "bg-[#E0E7FF] hover:bg-[#C7D2FE]"
                  }`}
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 pt-1 font-mono">
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
            <span className="font-bold text-[#5850EC]">Today</span>
          </div>
        </div>
      </div>

      {/* CARD 3: GPay / UPI Sales (Matches Average time to get paid + spline line in reference) */}
      <div className="finnova-card p-6 flex flex-col justify-between min-h-[220px]">
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>GPay / UPI Sales</span>
            <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[#5850EC]">
              <Clock className="w-3 h-3 text-[#5850EC]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2.5 tabular-nums">
            {formatINR(upiSales)}
          </div>
          <div className="text-[11px] font-semibold text-indigo-600 mt-1 flex items-center gap-1">
            <span>{upiCount} transactions</span>
            <span className="text-slate-400 font-normal">processed</span>
          </div>
        </div>

        {/* Smooth Purple Spline Curve with Circle Nodes (Exact match to reference image) */}
        <div className="pt-2 h-14 w-full">
          <svg viewBox="0 0 160 40" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="purpleSpline" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#818CF8" />
                <stop offset="100%" stop-color="#4F46E5" />
              </linearGradient>
            </defs>
            <path
              d="M 0,32 Q 30,30 50,22 T 90,16 T 120,8 T 160,4"
              fill="none"
              stroke="url(#purpleSpline)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {[
              { cx: 10, cy: 31 },
              { cx: 50, cy: 22 },
              { cx: 70, cy: 20 },
              { cx: 90, cy: 16 },
              { cx: 110, cy: 10 },
              { cx: 130, cy: 7 },
              { cx: 155, cy: 4 },
            ].map((pt, i) => (
              <circle
                key={i}
                cx={pt.cx}
                cy={pt.cy}
                r="2.5"
                fill="#FFFFFF"
                stroke="#4F46E5"
                strokeWidth="2"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* CARD 4: Instant Payout & Split (Matches Available for Instant Payout in reference) */}
      <div className="finnova-card p-6 flex flex-col justify-between min-h-[220px]">
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Available for Instant Payout</span>
            <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-3 h-3" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2.5 tabular-nums">
            {formatINR(totalRevenue)}
          </div>
          <div className="text-[11px] font-medium text-slate-400 mt-1">
            VR Street Karama Ledger
          </div>
        </div>

        {/* 3 Payment Method Pills + Payout Button (Exact match to reference image) */}
        <div className="pt-2 flex items-center justify-between gap-1.5">
          <div className="flex-1 py-1.5 px-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <div className="text-[9px] text-slate-400 font-mono">•••• 4242</div>
            <div className="text-[10px] font-bold text-slate-700">Cash</div>
          </div>

          <div className="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-b from-[#5850EC] to-[#4338CA] text-white text-center shadow-md shadow-indigo-500/20">
            <div className="text-[9px] text-indigo-200 font-mono">•••• 6789</div>
            <div className="text-[10px] font-bold">GPay</div>
          </div>

          <div className="flex-1 py-1.5 px-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <div className="text-[9px] text-slate-400 font-mono">•••• 1234</div>
            <div className="text-[10px] font-bold text-slate-700">UPI</div>
          </div>
        </div>
      </div>
    </div>
  );
}

