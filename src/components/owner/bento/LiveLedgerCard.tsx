"use client";

import { Check, Plus, Banknote, Smartphone } from "lucide-react";
import { formatINR } from "@/lib/utils/currency";
import { formatTimeIST } from "@/lib/utils/timezone";
import { Sale } from "@/lib/types";

interface LiveLedgerCardProps {
  sales: Sale[];
  onCorrectSale?: (sale: Sale) => void;
  onAddQuickSale?: () => void;
}

export function LiveLedgerCard({ sales = [], onCorrectSale, onAddQuickSale }: LiveLedgerCardProps) {
  const displaySales = sales.slice(0, 4);

  return (
    <div className="dark-glass-card p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between min-h-[260px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <h4 className="text-sm font-semibold text-white tracking-tight">
          Recent Transactions
        </h4>
        <button
          onClick={onAddQuickSale}
          className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          title="Filter or Refresh"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List (Exact visual match to the Tasks card in reference) */}
      <div className="space-y-3.5 my-auto py-2">
        {displaySales.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No transactions committed yet today.
          </div>
        ) : (
          displaySales.map((sale) => {
            const isCash = sale.payment_method === "CASH";
            const staffName = (sale as any).staff_name || sale.staff?.full_name || "Staff";

            return (
              <div
                key={sale.id}
                onClick={() => onCorrectSale && onCorrectSale(sale)}
                className="flex items-center justify-between gap-3 text-xs cursor-pointer group hover:bg-white/[0.02] p-1.5 -mx-1.5 rounded-xl transition-all"
              >
                {/* Checkmark + Transaction Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-blue-400 shadow-sm shadow-blue-500/30 shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-white font-medium group-hover:text-blue-300 transition-colors truncate block">
                      {sale.transaction_number} • {staffName}
                    </span>
                  </div>
                </div>

                {/* Amount & Status Badge */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono font-bold text-white tabular-nums">
                    {formatINR(sale.amount)}
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${
                      isCash ? "text-emerald-400" : "text-purple-400"
                    }`}
                  >
                    {isCash ? "Cash" : "GPay"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-2 text-[11px] text-slate-400 border-t border-white/5 flex items-center justify-between">
        <span>Shared shop sales ledger</span>
        <span className="text-blue-400 font-semibold">{sales.length} Total</span>
      </div>
    </div>
  );
}

