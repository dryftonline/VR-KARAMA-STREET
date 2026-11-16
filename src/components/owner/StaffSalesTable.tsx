"use client";

import { useState, useEffect } from "react";
import { Download, Filter, Search, User, Edit3, Banknote, Smartphone } from "lucide-react";
import { formatINR } from "@/lib/utils/currency";
import { formatTimeIST, formatDateIST } from "@/lib/utils/timezone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sale, Profile } from "@/lib/types";

interface StaffSalesTableProps {
  onCorrectSale?: (sale: Sale) => void;
  staffMembers: Profile[];
}

export function StaffSalesTable({
  onCorrectSale,
  staffMembers,
}: StaffSalesTableProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("ALL");
  const [paymentMethod, setPaymentMethod] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedStaffId !== "ALL") params.append("staffId", selectedStaffId);
      if (paymentMethod !== "ALL") params.append("paymentMethod", paymentMethod);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      params.append("limit", "200");

      const res = await fetch(`/api/sales/live?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.sales) {
        setSales(data.sales);
      }
    } catch (err) {
      console.error("Failed to load staff sales table:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedStaffId, paymentMethod, startDate, endDate]);

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (selectedStaffId !== "ALL") params.append("staffId", selectedStaffId);
    if (paymentMethod !== "ALL") params.append("paymentMethod", paymentMethod);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    window.open(`/api/reports/export-csv?${params.toString()}`, "_blank");
  };

  const filteredSales = sales.filter((s) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const tNum = (s.transaction_number || "").toLowerCase();
    const sName = ((s as any).staff_name || "").toLowerCase();
    return tNum.includes(query) || sName.includes(query);
  });

  return (
    <div className="rounded-2xl bg-navy-900 border border-navy-700/80 p-5 shadow-card space-y-5">
      {/* Filters & Export Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-navy-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Transaction Ledger &amp; Staff History
          </h3>
          <p className="text-xs text-slate-400">
            Audit individual transactions, filter by staff member, and export CSV reports.
          </p>
        </div>

        <Button variant="gold" size="sm" onClick={handleExportCsv} className="shrink-0">
          <Download className="w-4 h-4 mr-1.5" />
          Export CSV Report
        </Button>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by ID or staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-navy-950 border border-navy-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-gold"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>

        {/* Staff Select */}
        <div>
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-navy-950 border border-navy-700 text-xs text-white focus:outline-none focus:border-gold"
          >
            <option value="ALL">All Staff Members</option>
            {staffMembers.map((st) => (
              <option key={st.id} value={st.id}>
                {st.full_name} ({st.role})
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method */}
        <div>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-navy-950 border border-navy-700 text-xs text-white focus:outline-none focus:border-gold"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="CASH">Cash Only</option>
            <option value="UPI">GPay / UPI Only</option>
          </select>
        </div>

        {/* Clear Filters */}
        <div className="flex gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            title="Start Date"
            className="w-1/2 h-10 px-2 rounded-xl bg-navy-950 border border-navy-700 text-xs text-white focus:outline-none focus:border-gold"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            title="End Date"
            className="w-1/2 h-10 px-2 rounded-xl bg-navy-950 border border-navy-700 text-xs text-white focus:outline-none focus:border-gold"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-500">
          Loading transactions...
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500">
          No transactions found matching your filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-navy-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Date &amp; Time (IST)</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800/60 bg-navy-900/60">
              {filteredSales.map((sale) => {
                const staffName = (sale as any).staff_name || "Unknown Staff";

                return (
                  <tr key={sale.id} className="hover:bg-navy-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-white">
                      {sale.transaction_number}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-200">{staffName}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      <div>{formatDateIST(sale.created_at)}</div>
                      <div className="text-[10px] text-slate-500">
                        {formatTimeIST(sale.created_at)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={sale.payment_method === "CASH" ? "cash" : "upi"}
                        className="text-[10px] px-2 py-0.5"
                      >
                        {sale.payment_method === "CASH" ? "Cash" : "GPay / UPI"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-bold text-white font-mono text-right tabular-nums">
                      {formatINR(sale.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {onCorrectSale && (
                        <button
                          onClick={() => onCorrectSale(sale)}
                          title="Correct Transaction"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-gold hover:bg-navy-800 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

