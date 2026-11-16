"use client";

import { useEffect, useState, useRef } from "react";
import { Radio, Banknote, Smartphone, Clock, User, Edit3, ArrowUpRight } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatINR } from "@/lib/utils/currency";
import { formatTimeIST, formatDateIST } from "@/lib/utils/timezone";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Sale } from "@/lib/types";

interface LiveSalesFeedProps {
  initialSales?: Sale[];
  onCorrectSale?: (sale: Sale) => void;
  onNewSaleCommitted?: () => void;
}

export function LiveSalesFeed({
  initialSales = [],
  onCorrectSale,
  onNewSaleCommitted,
}: LiveSalesFeedProps) {
  const { info: toastInfo } = useToast();
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  // Sync initial sales if updated from parent
  useEffect(() => {
    if (initialSales && initialSales.length > 0) {
      setSales(initialSales);
    }
  }, [initialSales]);

  // Set up Supabase Realtime Subscription
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel("realtime:sales_feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sales",
        },
        async (payload) => {
          console.log("[Supabase Realtime] New sale received:", payload);
          const newRecord = payload.new as any;

          // Fetch staff profile for this new sale
          let staffName = "Staff";
          if (newRecord.staff_id) {
            const { data: staffData } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", newRecord.staff_id)
              .single();
            if (staffData?.full_name) {
              staffName = staffData.full_name;
            }
          }

          const fullSale: Sale = {
            id: newRecord.id,
            transaction_number: newRecord.transaction_number,
            staff_id: newRecord.staff_id,
            amount: Number(newRecord.amount),
            payment_method: newRecord.payment_method,
            business_date: newRecord.business_date,
            notes: newRecord.notes,
            created_at: newRecord.created_at,
            staff: {
              id: newRecord.staff_id,
              full_name: staffName,
            },
          };

          setSales((prev) => [fullSale, ...prev.slice(0, 49)]);
          setNewlyAddedId(fullSale.id);

          toastInfo(
            `₹${fullSale.amount} via ${fullSale.payment_method} by ${staffName}`,
            "⚡ Live Sale Recorded"
          );

          if (onNewSaleCommitted) {
            onNewSaleCommitted();
          }

          // Clear highlight after 3 seconds
          setTimeout(() => {
            setNewlyAddedId((curr) => (curr === fullSale.id ? null : curr));
          }, 3000);
        }
      )
      .subscribe((status) => {
        setIsLiveConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNewSaleCommitted, toastInfo]);

  return (
    <div className="rounded-2xl bg-navy-900 border border-navy-700/80 p-5 shadow-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-navy-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Live Sales Stream
            </h3>
            <p className="text-[11px] text-slate-400">
              Real-time transaction feed from all shop staff
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy-950 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {isLiveConnected ? "REALTIME ACTIVE" : "CONNECTING..."}
        </div>
      </div>

      {/* Feed list */}
      {sales.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <Clock className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs font-medium text-slate-400">
            No transactions recorded yet
          </p>
          <p className="text-[11px] text-slate-500">
            Sales will appear here instantly as staff members record them.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-navy-800/60 max-h-96 overflow-y-auto pr-1">
          {sales.map((sale) => {
            const isHighlight = newlyAddedId === sale.id;
            const staffName = (sale as any).staff_name || sale.staff?.full_name || "Staff";

            return (
              <div
                key={sale.id}
                className={`py-3.5 px-2.5 rounded-xl transition-all duration-300 flex items-center justify-between gap-3 ${
                  isHighlight
                    ? "bg-gold/15 border border-gold/40 shadow-gold"
                    : "hover:bg-navy-850/60"
                }`}
              >
                {/* Method Icon & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      sale.payment_method === "CASH"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                    }`}
                  >
                    {sale.payment_method === "CASH" ? (
                      <Banknote className="w-5 h-5" />
                    ) : (
                      <Smartphone className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white tracking-wide truncate">
                        {sale.transaction_number}
                      </span>
                      <Badge
                        variant={sale.payment_method === "CASH" ? "cash" : "upi"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {sale.payment_method === "CASH" ? "Cash" : "UPI"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1 text-slate-300">
                        <User className="w-3 h-3 text-gold/70" />
                        {staffName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatTimeIST(sale.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount & Correction trigger */}
                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <div className="text-base sm:text-lg font-black text-white tabular-nums tracking-tight">
                      {formatINR(sale.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {formatDateIST(sale.created_at)}
                    </div>
                  </div>

                  {onCorrectSale && (
                    <button
                      onClick={() => onCorrectSale(sale)}
                      title="Correct Transaction"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-gold hover:bg-navy-800 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

