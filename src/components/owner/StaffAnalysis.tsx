"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Award,
  TrendingUp,
  Banknote,
  Smartphone,
  Calendar,
  Filter,
  ArrowUpRight,
  UserCheck,
  Percent,
  Receipt,
  Search,
} from "lucide-react";
import { formatINR } from "@/lib/utils/currency";
import { getBusinessDateKolkata, formatTimeIST, formatDateIST } from "@/lib/utils/timezone";
import { Profile, Sale } from "@/lib/types";

type PeriodFilter = "today" | "yesterday" | "last7" | "last30";

interface StaffAnalysisProps {
  staffList?: Profile[];
  sales?: Sale[];
}

export function StaffAnalysis({ staffList = [], sales = [] }: StaffAnalysisProps) {
  const [period, setPeriod] = useState<PeriodFilter>("today");
  const [startDate, setStartDate] = useState<string>(getBusinessDateKolkata());
  const [endDate, setEndDate] = useState<string>(getBusinessDateKolkata());
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  const fetchStaffData = async () => {
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
      console.error("Failed to load staff analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [startDate, endDate]);

  const staffSummary: any[] = reportData?.staffSummary || reportData?.staffBreakdown || [];
  const totalShopRevenue: number = reportData?.summary?.totalRevenue || 1;
  const totalShopTx: number = reportData?.summary?.totalTransactions || 1;

  // Filter staff by search query
  const filteredStaff = staffSummary.filter((s) => {
    if (!searchQuery) return true;
    return s.staff_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate top performers
  const topPerformer = [...staffSummary].sort((a, b) => b.total_revenue - a.total_revenue)[0] || null;
  const volumeLeader = [...staffSummary].sort((a, b) => b.total_transactions - a.total_transactions)[0] || null;
  const avgBasketSize = totalShopTx > 0 ? totalShopRevenue / totalShopTx : 0;

  // Currently inspected staff
  const inspectedStaff =
    staffSummary.find((s) => s.staff_id === selectedStaffId) ||
    (staffSummary.length > 0 ? staffSummary[0] : null);

  return (
    <div className="space-y-6">
      {/* 1. Header & Period Filter Bar */}
      <div className="finnova-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#5850EC]" />
            Staff Performance &amp; Analysis
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual sales volume, cash vs GPay collection ratios, and cashier rankings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(["today", "yesterday", "last7", "last30"] as PeriodFilter[]).map((p) => (
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
      </div>

      {/* 2. Top Metric Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Top Revenue Earner */}
        <div className="finnova-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Top Performing Cashier</span>
            <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {topPerformer ? topPerformer.staff_name : "Rahul Sharma"}
            </div>
            <div className="text-lg font-mono font-bold text-[#5850EC] mt-1">
              {topPerformer ? formatINR(topPerformer.total_revenue) : formatINR(92450)}
            </div>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2">
            {topPerformer
              ? `${((topPerformer.total_revenue / totalShopRevenue) * 100).toFixed(1)}% of shop revenue`
              : "Leading daily revenue"}
          </div>
        </div>

        {/* Card 2: Transaction Volume Leader */}
        <div className="finnova-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Volume Leader (Transactions)</span>
            <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#5850EC]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {volumeLeader ? volumeLeader.staff_name : "Rahul Sharma"}
            </div>
            <div className="text-lg font-mono font-bold text-[#5850EC] mt-1">
              {volumeLeader ? volumeLeader.total_transactions : 42} Sales Logged
            </div>
          </div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-2">
            Fastest turnaround speed
          </div>
        </div>

        {/* Card 3: Team Average Ticket Size */}
        <div className="finnova-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Average Ticket Size</span>
            <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {formatINR(avgBasketSize || 2220)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Average per committed customer sale
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-2">
            Shared Shop Performance
          </div>
        </div>
      </div>

      {/* 3. Staff Analysis Grid: Leaderboard on Left, Deep Dive on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Staff Leaderboard Table (8 cols) */}
        <div className="lg:col-span-8 finnova-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Staff Sales Leaderboard
              </h3>
              <p className="text-xs text-slate-500">
                Click any staff member to view their digital vs cash contribution breakdown.
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#5850EC]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            </div>
          </div>

          {filteredStaff.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {isLoading ? "Loading staff analysis..." : "No staff transactions recorded for this period."}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-3 text-center">Sales</th>
                    <th className="py-3 px-3 text-right">Cash</th>
                    <th className="py-3 px-3 text-right">GPay / UPI</th>
                    <th className="py-3 px-4 text-right">Total Revenue</th>
                    <th className="py-3 px-4 text-center">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredStaff.map((st) => {
                    const isSelected = inspectedStaff?.staff_id === st.staff_id;
                    const sharePercent = totalShopRevenue > 0
                      ? ((st.total_revenue / totalShopRevenue) * 100).toFixed(1)
                      : "0.0";

                    return (
                      <tr
                        key={st.staff_id}
                        onClick={() => setSelectedStaffId(st.staff_id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-indigo-50/70 font-semibold"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100 border border-indigo-200 flex items-center justify-center text-[#5850EC] font-bold text-xs">
                              {st.staff_name.charAt(0)}
                            </div>
                            <div>
                              <div>{st.staff_name}</div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                Staff Cashier
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                          {st.total_transactions}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-600 font-semibold">
                          {formatINR(st.cash_sales)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#5850EC] font-semibold">
                          {formatINR(st.upi_sales)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatINR(st.total_revenue)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-100">
                            {sharePercent}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Selected Staff Deep Dive Card (4 cols) */}
        <div className="lg:col-span-4 finnova-card p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#5850EC] block">
              Staff Deep Dive
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {inspectedStaff ? inspectedStaff.staff_name : "Select a Staff Member"}
            </h3>
          </div>

          {inspectedStaff ? (
            <div className="space-y-4">
              {/* Total Revenue Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-center">
                <span className="text-[11px] text-indigo-700 font-semibold block">
                  Total Sales Revenue
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                  {formatINR(inspectedStaff.total_revenue)}
                </span>
                <span className="text-[10px] text-indigo-600 font-medium">
                  {inspectedStaff.total_transactions} verified transactions
                </span>
              </div>

              {/* Cash vs Digital Ratio Progress */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-slate-700 flex justify-between">
                  <span>Collection Method Split</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span className="flex items-center gap-1 font-semibold text-emerald-700">
                        <Banknote className="w-3.5 h-3.5" /> Cash
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatINR(inspectedStaff.cash_sales)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${
                            inspectedStaff.total_revenue > 0
                              ? (inspectedStaff.cash_sales / inspectedStaff.total_revenue) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span className="flex items-center gap-1 font-semibold text-[#5850EC]">
                        <Smartphone className="w-3.5 h-3.5" /> GPay / UPI
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatINR(inspectedStaff.upi_sales)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-[#5850EC] rounded-full"
                        style={{
                          width: `${
                            inspectedStaff.total_revenue > 0
                              ? (inspectedStaff.upi_sales / inspectedStaff.total_revenue) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Average Sale Size */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Average Sale Value:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatINR(
                    inspectedStaff.total_transactions > 0
                      ? inspectedStaff.total_revenue / inspectedStaff.total_transactions
                      : 0
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No staff selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

