"use client";

import { useEffect, useState } from "react";
import { History, RefreshCw, Banknote, Smartphone } from "lucide-react";
import { formatINR } from "@/lib/utils/currency";
import { formatTimeIST } from "@/lib/utils/timezone";
import { Sale } from "@/lib/types";

interface MySalesTodayListProps {
  refreshTrigger?: number;
}

export function MySalesTodayList({ refreshTrigger }: MySalesTodayListProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMySales = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/sales/live?limit=30");
      const data = await res.json();
      if (res.ok && data.sales) {
        setSales(data.sales);
      }
    } catch (err) {
      console.error("Failed to load staff sales:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMySales();
  }, [refreshTrigger]);

  return (
    <div className="finnova-card p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#5850EC]" />
          <h3 className="text-sm font-bold text-slate-900">My Recorded Sales Today</h3>
        </div>
        <button
          onClick={fetchMySales}
          disabled={isLoading}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Refresh Sales"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading && sales.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          Loading your recent records...
        </div>
      ) : sales.length === 0 ? (
        <div className="py-6 text-center space-y-1">
          <p className="text-xs text-slate-500 font-medium">No sales recorded yet today</p>
          <p className="text-[11px] text-slate-400">
            Recorded sales will appear here for your confirmation.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
          {sales.map((sale) => (
            <div key={sale.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    sale.payment_method === "CASH"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : "bg-indigo-50 text-[#5850EC] border border-indigo-100"
                  }`}
                >
                  {sale.payment_method === "CASH" ? (
                    <Banknote className="w-4 h-4" />
                  ) : (
                    <Smartphone className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="font-mono text-xs font-bold text-slate-800">
                    #{sale.transaction_number}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {formatTimeIST(sale.created_at)}
                    {sale.notes && ` • ${sale.notes}`}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-black text-slate-900 font-mono">
                  {formatINR(sale.amount)}
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    sale.payment_method === "CASH" ? "text-emerald-600" : "text-[#5850EC]"
                  }`}
                >
                  {sale.payment_method}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
