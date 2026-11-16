"use client";

import { useEffect, useState } from "react";
import { History, RefreshCw, Banknote, Smartphone, CheckCircle2 } from "lucide-react";
import { formatINR } from "@/lib/utils/currency";
import { formatTimeIST } from "@/lib/utils/timezone";
import { Sale } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface MySalesTodayListProps {
  refreshTrigger?: number;
}

export function MySalesTodayList({ refreshTrigger }: MySalesTodayListProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMySales = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/sales/live?limit=50");
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

    // Supabase Realtime channel for live sync (INSERT, UPDATE, DELETE)
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("staff-sales-live-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        () => {
          fetchMySales();
        }
      )
      .subscribe();

    const handleRefresh = () => {
      fetchMySales();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("refresh-owner-ledger", handleRefresh);
    }

    return () => {
      supabase.removeChannel(channel);
      if (typeof window !== "undefined") {
        window.removeEventListener("refresh-owner-ledger", handleRefresh);
      }
    };
  }, [refreshTrigger]);

  const totalAmount = sales.reduce((sum, s) => sum + Number(s.amount), 0);
  const cashAmount = sales
    .filter((s) => s.payment_method === "CASH")
    .reduce((sum, s) => sum + Number(s.amount), 0);
  const upiAmount = sales
    .filter((s) => s.payment_method === "UPI")
    .reduce((sum, s) => sum + Number(s.amount), 0);
  const cashCount = sales.filter((s) => s.payment_method === "CASH").length;
  const upiCount = sales.filter((s) => s.payment_method === "UPI").length;

  return (
    <div className="finnova-card p-6 space-y-4">
      {/* Header with Title and Refresh button */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#5850EC]" />
          <h3 className="text-sm font-bold text-slate-900">My Recorded Sales Today</h3>
          {sales.length > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#5850EC]">
              {sales.length}
            </span>
          )}
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

      {/* Summary Banner for Staff Cashier */}
      {sales.length > 0 && (
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 text-center">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
              Total Sales
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">
              {formatINR(totalAmount)}
            </span>
          </div>
          <div className="border-x border-slate-200/60">
            <span className="text-[10px] text-emerald-600 block font-semibold uppercase tracking-wider">
              Cash ({cashCount})
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-700 font-mono">
              {formatINR(cashAmount)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#5850EC] block font-semibold uppercase tracking-wider">
              GPay / UPI ({upiCount})
            </span>
            <span className="text-xs sm:text-sm font-black text-indigo-700 font-mono">
              {formatINR(upiAmount)}
            </span>
          </div>
        </div>
      )}

      {/* List or Empty State */}
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
                  {sale.payment_method === "CASH" ? "Cash" : "GPay / UPI"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
