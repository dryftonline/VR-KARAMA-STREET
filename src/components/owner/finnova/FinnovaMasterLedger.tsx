"use client";

import { useState } from "react";
import {
  Search,
  Calendar,
  Filter,
  CheckCircle2,
  Receipt,
  User,
  Clock,
  ArrowUpRight,
  Plus,
  Link as LinkIcon,
  Printer,
  Edit3,
  Trash2,
} from "lucide-react";
import { formatINR } from "@/lib/utils/currency";
import { formatTimeIST, formatDateIST } from "@/lib/utils/timezone";
import { Sale, Profile } from "@/lib/types";

interface FinnovaMasterLedgerProps {
  sales: Sale[];
  staffList: Profile[];
  onCorrectSale?: (sale: Sale) => void;
  onDeleteSale?: (sale: Sale) => void;
  onRecordSaleClick?: () => void;
}

export function FinnovaMasterLedger({
  sales = [],
  staffList = [],
  onCorrectSale,
  onDeleteSale,
  onRecordSaleClick,
}: FinnovaMasterLedgerProps) {
  const [activeFilterTab, setActiveFilterTab] = useState<"ALL" | "CASH" | "UPI">("ALL");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  // Filter sales
  const filteredSales = sales.filter((s) => {
    if (activeFilterTab !== "ALL" && s.payment_method !== activeFilterTab) return false;
    if (selectedStaffId !== "ALL" && s.staff_id !== selectedStaffId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const tNum = (s.transaction_number || "").toLowerCase();
      const sName = ((s as any).staff_name || s.staff?.full_name || "").toLowerCase();
      return tNum.includes(q) || sName.includes(q);
    }
    return true;
  });

  // Selected sale defaults to the first item
  const activeSale =
    filteredSales.find((s) => s.id === selectedSaleId) || filteredSales[0] || null;

  const cashCount = sales.filter((s) => s.payment_method === "CASH").length;
  const upiCount = sales.filter((s) => s.payment_method === "UPI").length;

  return (
    <div className="space-y-5">
      {/* 1. Sleek Filter Bar with White Pills (Exact match to reference image) */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Active filters badge */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white font-semibold">
            <span>Active filters</span>
            <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">
              2
            </span>
          </div>

          {/* Staff filter dropdown */}
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-slate-700 font-medium focus:outline-none focus:border-[#5850EC] shadow-sm"
          >
            <option value="ALL">All staff members</option>
            {staffList
              .filter((st) => st.role === "STAFF")
              .map((st) => (
                <option key={st.id} value={st.id}>
                  {st.full_name}
                </option>
              ))}
          </select>

          {/* Payment method dropdown */}
          <select
            value={activeFilterTab}
            onChange={(e) => setActiveFilterTab(e.target.value as any)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-slate-700 font-medium focus:outline-none focus:border-[#5850EC] shadow-sm"
          >
            <option value="ALL">All payment methods</option>
            <option value="CASH">Cash Only</option>
            <option value="UPI">GPay / UPI Only</option>
          </select>
        </div>

        {/* Date Filter & Search Input */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200/90 text-slate-700 font-medium shadow-sm">
            <span>November 2026</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Enter sale # or staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-3.5 pr-8 py-2 rounded-xl bg-white border border-slate-200/90 text-slate-700 placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:border-[#5850EC] shadow-sm w-48 sm:w-56"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 2. Master Dark Navy & Royal Violet Split Container (Exact match to reference image) */}
      <div className="finnova-dark-container p-6 sm:p-7 text-white">
        {/* Top Split Header with Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Live Sales Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any transaction to inspect details or make corrections.
            </p>
          </div>

          {/* Centered Filter Switcher Pills */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10 text-xs">
            <button
              onClick={() => setActiveFilterTab("ALL")}
              className={`px-4 py-1.5 rounded-full font-semibold transition-all ${
                activeFilterTab === "ALL"
                  ? "bg-[#5850EC] text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Sales
            </button>
            <button
              onClick={() => setActiveFilterTab("CASH")}
              className={`px-4 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                activeFilterTab === "CASH"
                  ? "bg-[#5850EC] text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Cash</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">
                {cashCount}
              </span>
            </button>
            <button
              onClick={() => setActiveFilterTab("UPI")}
              className={`px-4 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                activeFilterTab === "UPI"
                  ? "bg-[#5850EC] text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>GPay / UPI</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">
                {upiCount}
              </span>
            </button>
          </div>
        </div>

        {/* 2-Column Split: List on Left, Royal Purple Detail Card on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 items-start">
          {/* LEFT COLUMN: List of Sales Items (5 cols) */}
          <div className="lg:col-span-5 space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredSales.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No transactions match the selected filters.
              </div>
            ) : (
              filteredSales.map((sale) => {
                const isSelected = activeSale?.id === sale.id;
                const isCash = sale.payment_method === "CASH";
                const staffName =
                  (sale as any).staff_name || sale.staff?.full_name || "Staff";

                return (
                  <div
                    key={sale.id}
                    onClick={() => setSelectedSaleId(sale.id)}
                    className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#5850EC] text-white shadow-lg shadow-indigo-600/30 scale-[1.01]"
                        : "bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/5"
                    }`}
                  >
                    {/* Staff Avatar + ID + Date */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? "bg-white text-[#5850EC]"
                            : "bg-white/10 text-white"
                        }`}
                      >
                        {staffName.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-xs tracking-tight truncate">
                          # {sale.transaction_number}
                        </div>
                        <div
                          className={`text-[10px] ${
                            isSelected ? "text-indigo-100" : "text-slate-400"
                          }`}
                        >
                          {staffName} • {formatTimeIST(sale.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Method Badge + Amount */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : isCash
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-purple-500/15 text-purple-300"
                        }`}
                      >
                        {isCash ? "Cash" : "GPay"}
                      </span>

                      <span className="font-mono font-bold text-xs tabular-nums">
                        {formatINR(sale.amount)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT COLUMN: Royal Violet Selected Transaction Details (7 cols) */}
          <div className="lg:col-span-7">
            {activeSale ? (
              <div className="finnova-purple-card p-6 sm:p-7 space-y-6 text-white relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-52 h-52 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header: Transaction ID & Status */}
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-indigo-200 font-semibold">
                      Transaction details
                    </span>
                    <div className="flex items-center gap-2.5 mt-1">
                      <h4 className="text-2xl font-black text-white tracking-tight font-mono">
                        # {activeSale.transaction_number}
                      </h4>
                      <span className="text-[11px] font-semibold bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/20">
                        Committed
                      </span>
                    </div>
                  </div>

                  {/* Company Logo / VR Street Karama */}
                  <div className="text-right">
                    <span className="text-[11px] text-indigo-200 font-medium block">
                      Company
                    </span>
                    <span className="text-sm font-bold text-white flex items-center justify-end gap-1.5 mt-0.5">
                      VR Street Karama
                    </span>
                  </div>
                </div>

                {/* Staff Attribution Section */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/10 border border-white/15">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white text-[#4F46E5] flex items-center justify-center font-bold text-sm shadow">
                      {((activeSale as any).staff_name || "S").charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {(activeSale as any).staff_name || "Staff Member"}
                      </div>
                      <div className="text-[11px] text-indigo-200">
                        Cashier / Sales Representative
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-indigo-200 uppercase tracking-wider block">
                      Date &amp; Time (IST)
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {formatTimeIST(activeSale.created_at)} • {formatDateIST(activeSale.created_at)}
                    </span>
                  </div>
                </div>

                {/* 3 Detail Cards Grid (Exact match to reference image UI Design, Development, QA) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
                    <div className="flex justify-between items-center text-xs text-indigo-200 mb-1">
                      <span>Amount</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-lg font-black text-white font-mono tabular-nums">
                      {formatINR(activeSale.amount)}
                    </div>
                    <div className="text-[10px] text-indigo-200 mt-1">
                      Exact gross total
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
                    <div className="flex justify-between items-center text-xs text-indigo-200 mb-1">
                      <span>Method</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-lg font-black text-white">
                      {activeSale.payment_method === "CASH" ? "Cash" : "GPay / UPI"}
                    </div>
                    <div className="text-[10px] text-indigo-200 mt-1">
                      Payment type
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
                    <div className="flex justify-between items-center text-xs text-indigo-200 mb-1">
                      <span>Status</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    </div>
                    <div className="text-lg font-black text-emerald-300">
                      Verified
                    </div>
                    <div className="text-[10px] text-indigo-200 mt-1">
                      Shared shop ledger
                    </div>
                  </div>
                </div>

                {/* Bottom Total & Action Bar */}
                <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-indigo-200 block font-medium">
                      Total Ledger Amount
                    </span>
                    <span className="text-2xl font-black text-white font-mono tabular-nums">
                      {formatINR(activeSale.amount)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {onCorrectSale && (
                      <button
                        onClick={() => onCorrectSale(activeSale)}
                        className="py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Correct Sale</span>
                      </button>
                    )}

                    {onDeleteSale && (
                      <button
                        onClick={() => onDeleteSale(activeSale)}
                        className="py-2.5 px-3.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="Delete this transaction from ledger"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}

                    <button
                      onClick={() => window.print()}
                      className="py-2.5 px-5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      Print Receipt
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="finnova-purple-card p-12 text-center text-white space-y-2">
                <Receipt className="w-10 h-10 mx-auto text-indigo-200" />
                <h4 className="text-base font-bold">No Transaction Selected</h4>
                <p className="text-xs text-indigo-200">
                  Click any transaction on the left to view the invoice card.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

