import { IndianRupee, Banknote, Smartphone, Receipt } from "lucide-react";
import { formatINR } from "@/lib/utils/currency";

interface KpiCardsProps {
  totalRevenue: number;
  cashSales: number;
  upiSales: number;
  totalTransactions: number;
  cashCount: number;
  upiCount: number;
}

export function KpiCards({
  totalRevenue,
  cashSales,
  upiSales,
  totalTransactions,
  cashCount,
  upiCount,
}: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Revenue Card */}
      <div className="rounded-2xl bg-gradient-to-br from-navy-900 via-navy-900 to-navy-850 border border-gold/40 p-5 shadow-gold relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gold/10 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-transform" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gold uppercase tracking-wider">
            Total Revenue
          </span>
          <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums">
          {formatINR(totalRevenue)}
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
          <span>Combined shared shop sales</span>
        </div>
      </div>

      {/* 2. Cash Sales Card */}
      <div className="rounded-2xl bg-navy-900 border border-emerald-500/30 p-5 shadow-card relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Cash Sales
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Banknote className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums">
          {formatINR(cashSales)}
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
          <span className="font-semibold text-emerald-400">{cashCount}</span> transactions
        </div>
      </div>

      {/* 3. GPay / UPI Sales Card */}
      <div className="rounded-2xl bg-navy-900 border border-purple-500/30 p-5 shadow-card relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
            GPay / UPI Sales
          </span>
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums">
          {formatINR(upiSales)}
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
          <span className="font-semibold text-purple-300">{upiCount}</span> transactions
        </div>
      </div>

      {/* 4. Total Transactions Card */}
      <div className="rounded-2xl bg-navy-900 border border-navy-700/80 p-5 shadow-card relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Total Transactions
          </span>
          <div className="w-9 h-9 rounded-xl bg-navy-800 border border-navy-700 flex items-center justify-center text-blue-400">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums">
          {totalTransactions}
        </div>
        <div className="text-[11px] text-slate-400 mt-2">
          {totalTransactions > 0
            ? `Avg. ${formatINR(totalRevenue / totalTransactions)} / sale`
            : "No transactions yet"}
        </div>
      </div>
    </div>
  );
}

