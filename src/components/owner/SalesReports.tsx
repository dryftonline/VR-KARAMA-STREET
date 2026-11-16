"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  Calendar,
  Filter,
  Users,
  TrendingUp,
  PieChart as PieIcon,
  Receipt,
  Edit3,
  Trash2,
  Banknote,
  Smartphone,
} from "lucide-react";
import { formatINR } from "@/lib/utils/currency";
import { getBusinessDateKolkata, formatTimeIST, formatDateIST } from "@/lib/utils/timezone";
import { Sale } from "@/lib/types";
import { DeleteSaleModal } from "@/components/owner/DeleteSaleModal";
import { TransactionCorrectionModal } from "@/components/owner/TransactionCorrectionModal";

type PeriodFilter = "today" | "yesterday" | "last7" | "last30" | "custom";

export function SalesReports() {
  const [period, setPeriod] = useState<PeriodFilter>("today");
  const [startDate, setStartDate] = useState<string>(getBusinessDateKolkata());
  const [endDate, setEndDate] = useState<string>(getBusinessDateKolkata());
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals for Correcting or Deleting Sales from the Report
  const [selectedSaleToCorrect, setSelectedSaleToCorrect] = useState<Sale | null>(null);
  const [selectedSaleToDelete, setSelectedSaleToDelete] = useState<Sale | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // Compute date ranges when period filter changes
  useEffect(() => {
    const today = new Date();
    const todayStr = getBusinessDateKolkata(today);

    if (period === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (period === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getBusinessDateKolkata(yesterday);
      setStartDate(yesterdayStr);
      setEndDate(yesterdayStr);
    } else if (period === "last7") {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 6);
      setStartDate(getBusinessDateKolkata(past7));
      setEndDate(todayStr);
    } else if (period === "last30") {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 29);
      setStartDate(getBusinessDateKolkata(past30));
      setEndDate(todayStr);
    }
  }, [period]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/reports/summary?startDate=${startDate}&endDate=${endDate}`
      );
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();

    const handleRefresh = () => {
      fetchReports();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("refresh-owner-ledger", handleRefresh);
      return () => {
        window.removeEventListener("refresh-owner-ledger", handleRefresh);
      };
    }
  }, [startDate, endDate]);

  const dailyChartData = (reportData?.dailyBreakdown || []).map((d: any) => ({
    date: d.date.slice(5),
    total: d.total_revenue,
    cash: d.cash_sales,
    upi: d.upi_sales,
    count: d.total_transactions,
  }));

  const cashAmount = reportData?.summary?.cashSales || 0;
  const upiAmount = reportData?.summary?.upiSales || 0;
  const totalAmount = reportData?.summary?.totalRevenue || 0;
  const totalCount = reportData?.summary?.totalTransactions || 0;
  const reportSales: Sale[] = reportData?.sales || [];

  const cashPercent = totalAmount > 0 ? ((cashAmount / totalAmount) * 100).toFixed(1) : "0.0";
  const upiPercent = totalAmount > 0 ? ((upiAmount / totalAmount) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* FILTER CONTROLS */}
      <div className="finnova-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#5850EC]" />
          <span className="text-sm font-bold text-slate-900">Report Period:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["today", "yesterday", "last7", "last30", "custom"] as PeriodFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                period === p
                  ? "bg-[#5850EC] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              {p === "last7" ? "Last 7 Days" : p === "last30" ? "Last 30 Days" : p}
            </button>
          ))}
        </div>

        {/* Custom date range picker if custom selected */}
        {period === "custom" && (
          <div className="w-full sm:w-auto flex items-center gap-2 pt-2 sm:pt-0">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
            />
          </div>
        )}
      </div>

      {/* SUMMARY STATS & CASH VS UPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Cash vs UPI comparison Card */}
        <div className="finnova-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#5850EC]" />
              Cash vs UPI Ratio
            </h4>
            <span className="text-xs text-slate-400 font-medium">By Value</span>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-emerald-600 font-semibold">Cash ({cashPercent}%)</span>
                <span className="text-slate-900 font-mono font-bold">{formatINR(cashAmount)}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${cashPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-indigo-600 font-semibold">GPay / UPI ({upiPercent}%)</span>
                <span className="text-slate-900 font-mono font-bold">{formatINR(upiAmount)}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[#5850EC] rounded-full transition-all duration-500"
                  style={{ width: `${upiPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-center text-xs">
            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <div className="text-emerald-700 text-[11px] font-medium">Cash Count</div>
              <div className="font-extrabold text-emerald-700 text-lg mt-0.5">
                {reportData?.summary?.cashCount || 0}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <div className="text-indigo-700 text-[11px] font-medium">UPI Count</div>
              <div className="font-extrabold text-[#5850EC] text-lg mt-0.5">
                {reportData?.summary?.upiCount || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Daily Revenue Chart */}
        <div className="md:col-span-2 finnova-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#5850EC]" />
              Daily Revenue Trend ({startDate} to {endDate})
            </h4>
            <span className="text-sm text-[#5850EC] font-black">
              Total: {formatINR(totalAmount)}
            </span>
          </div>

          {dailyChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              No sales recorded for this period
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111625",
                      borderColor: "#5850EC",
                      borderRadius: "1rem",
                      color: "#fff",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                    }}
                    formatter={(val: any) => [formatINR(val), "Revenue"]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar dataKey="cash" name="Cash" fill="#10B981" radius={[6, 6, 0, 0]} stackId="a" />
                  <Bar dataKey="upi" name="GPay / UPI" fill="#5850EC" radius={[6, 6, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* STAFF BREAKDOWN TABLE */}
      <div className="finnova-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Users className="w-4 h-4 text-[#5850EC]" />
          <h4 className="text-sm font-bold text-slate-900">
            Staff Revenue Breakdown for Selected Period
          </h4>
        </div>

        {!reportData?.staffBreakdown || reportData.staffBreakdown.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No staff sales found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4 text-center">Transactions</th>
                  <th className="py-3 px-4 text-right">Cash Revenue</th>
                  <th className="py-3 px-4 text-right">UPI Revenue</th>
                  <th className="py-3 px-4 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono text-[11px]">
                {reportData.staffBreakdown.map((s: any) => (
                  <tr key={s.staff_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 font-sans">
                      {s.staff_name}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">
                      {s.total_transactions}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-bold">
                      {formatINR(s.cash_sales)}
                    </td>
                    <td className="py-3 px-4 text-right text-[#5850EC] font-bold">
                      {formatINR(s.upi_sales)}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {formatINR(s.total_revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAILED TRANSACTIONS LIST & ACTION MANAGEMENT */}
      <div className="finnova-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#5850EC]" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Detailed Transaction Ledger ({reportSales.length})
              </h4>
              <p className="text-[11px] text-slate-500">
                Correct values or permanently delete accidental sales. Deletions reflect immediately across all cashier terminals.
              </p>
            </div>
          </div>
        </div>

        {reportSales.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            {isLoading ? "Loading transaction records..." : "No individual sales recorded for this period."}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-3 text-center">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {reportSales.map((s) => {
                  const staffName = (s as any).staff_name || s.staff?.full_name || "Staff";
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-xs">
                        #{s.transaction_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {staffName}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                            s.payment_method === "CASH"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          }`}
                        >
                          {s.payment_method === "CASH" ? (
                            <Banknote className="w-3 h-3" />
                          ) : (
                            <Smartphone className="w-3 h-3" />
                          )}
                          {s.payment_method === "CASH" ? "Cash" : "GPay / UPI"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        {formatINR(s.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {formatTimeIST(s.created_at)} • {formatDateIST(s.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Correct Button */}
                          <button
                            onClick={() => {
                              setSelectedSaleToCorrect(s);
                              setIsCorrectionModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#5850EC] hover:bg-indigo-50 transition-colors"
                            title="Correct this transaction"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              setSelectedSaleToDelete(s);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Delete this transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALS */}
      <TransactionCorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => {
          setIsCorrectionModalOpen(false);
          setSelectedSaleToCorrect(null);
        }}
        sale={selectedSaleToCorrect}
        onSuccess={fetchReports}
      />

      <DeleteSaleModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedSaleToDelete(null);
        }}
        sale={selectedSaleToDelete}
        onSuccess={fetchReports}
      />
    </div>
  );
}
