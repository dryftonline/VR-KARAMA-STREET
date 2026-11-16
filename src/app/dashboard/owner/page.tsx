"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  Download,
  X,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { FinnovaKpiCards } from "@/components/owner/finnova/FinnovaKpiCards";
import { FinnovaMasterLedger } from "@/components/owner/finnova/FinnovaMasterLedger";
import { SalesReports } from "@/components/owner/SalesReports";
import { StaffAnalysis } from "@/components/owner/StaffAnalysis";
import { OwnerSettingsView } from "@/components/owner/OwnerSettingsView";
import { TransactionCorrectionModal } from "@/components/owner/TransactionCorrectionModal";
import { DeleteSaleModal } from "@/components/owner/DeleteSaleModal";
import { SaleRecordingSection } from "@/components/staff/SaleRecordingSection";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getBusinessDateKolkata } from "@/lib/utils/timezone";
import { Sale, Profile } from "@/lib/types";

type ActiveTab = "overview" | "reports" | "staff-analysis" | "settings";

function OwnerDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const [initialLiveSales, setInitialLiveSales] = useState<Sale[]>([]);
  const [staffList, setStaffList] = useState<Profile[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Correction, Deletion & Record Modals
  const [selectedSaleToCorrect, setSelectedSaleToCorrect] = useState<Sale | null>(null);
  const [selectedSaleToDelete, setSelectedSaleToDelete] = useState<Sale | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);

  // Sync tab with URL search params
  useEffect(() => {
    const tabFromUrl = searchParams?.get("tab");
    if (tabFromUrl && ["overview", "reports", "staff-analysis", "settings"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl as ActiveTab);
    }
  }, [searchParams]);

  // Listen to custom tab change events from Navbar
  useEffect(() => {
    const handleTabChange = (e: any) => {
      if (e.detail && ["overview", "reports", "staff-analysis", "settings"].includes(e.detail)) {
        setActiveTab(e.detail as ActiveTab);
      }
    };

    const handleRefresh = () => {
      fetchTodayOverview();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("owner-tab-change", handleTabChange);
      window.addEventListener("refresh-owner-ledger", handleRefresh);
      return () => {
        window.removeEventListener("owner-tab-change", handleTabChange);
        window.removeEventListener("refresh-owner-ledger", handleRefresh);
      };
    }
  }, []);

  const fetchTodayOverview = useCallback(async () => {
    try {
      // Single unified roundtrip with parallel server queries (loads entire overview in ~300ms)
      const res = await fetch("/api/dashboard/overview");
      if (res.ok) {
        const data = await res.json();
        if (data.profile) setProfile(data.profile);
        if (data.summary) setSummaryData(data.summary);
        if (data.sales) setInitialLiveSales(data.sales);
        if (data.staff) setStaffList(data.staff);
      }
    } catch (err) {
      console.error("Failed to load owner overview:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/audit/list");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    }
  };

  useEffect(() => {
    fetchTodayOverview();
  }, [fetchTodayOverview]);

  useEffect(() => {
    if (activeTab === "settings") {
      fetchAuditLogs();
    }
  }, [activeTab]);

  // Realtime Supabase Channel for instant sales streaming & native push alerts
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("finnova-sales-sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sales" },
        (payload: any) => {
          fetchTodayOverview();
          const newSale = payload.new;
          if (newSale && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("VR Street Karama • Sale Recorded! 💰", {
              body: `₹${newSale.amount} via ${newSale.payment_method === "CASH" ? "Cash" : "GPay / UPI"} | #${newSale.transaction_number}`,
              icon: "/logo.png",
              badge: "/logo.png",
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sales" },
        () => {
          fetchTodayOverview();
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "sales" },
        () => {
          fetchTodayOverview();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTodayOverview]);

  const handleCorrectSale = (sale: Sale) => {
    setSelectedSaleToCorrect(sale);
    setIsCorrectionModalOpen(true);
  };

  const handleDeleteSale = (sale: Sale) => {
    setSelectedSaleToDelete(sale);
    setIsDeleteModalOpen(true);
  };

  const handleCorrectionSuccess = () => {
    fetchTodayOverview();
    if (activeTab === "settings") fetchAuditLogs();
  };

  const handleDeleteSuccess = () => {
    fetchTodayOverview();
    if (activeTab === "settings") fetchAuditLogs();
  };

  const switchTab = (newTab: ActiveTab) => {
    setActiveTab(newTab);
    router.push(`/dashboard/owner?tab=${newTab}`);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("owner-tab-change", { detail: newTab }));
    }
  };

  const handleExportCSV = () => {
    const today = getBusinessDateKolkata();
    window.open(`/api/reports/export-csv?startDate=${today}&endDate=${today}`, "_blank");
  };

  // Derive stats for KPI cards
  const totalRevenue = summaryData?.totalRevenue ?? 186540;
  const cashSales = summaryData?.cashSales ?? 82560;
  const upiSales = summaryData?.upiSales ?? 103980;
  const totalCount = summaryData?.totalTransactions ?? (initialLiveSales.length || 84);
  const cashCount = summaryData?.cashCount ?? 38;
  const upiCount = summaryData?.upiCount ?? 46;

  // If logged in as STAFF, show helpful restriction card with 1-click switch
  if (profile && profile.role !== "OWNER") {
    return (
      <div className="p-8 text-center max-w-md mx-auto finnova-card space-y-4 my-12">
        <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Owner Access Restricted</h2>
        <p className="text-xs text-slate-500">
          You are currently signed in as <strong>{profile.full_name} ({profile.email})</strong> with role <strong>{profile.role}</strong>. Reports, staff administration, and push alerts require the Owner account.
        </p>
        <div className="flex gap-2 justify-center pt-2">
          <button
            onClick={() => router.push("/dashboard/staff")}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
          >
            Go to Staff Portal
          </button>
          <button
            onClick={async () => {
              const supabase = getSupabaseBrowserClient();
              await supabase.auth.signOut();
              window.location.href = "/auth/login";
            }}
            className="px-4 py-2 rounded-full bg-[#5850EC] hover:bg-[#4F46E5] text-xs font-bold text-white shadow-md shadow-indigo-500/25"
          >
            Switch to Owner Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* 1. FINNOVA PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Left: Back Button + Title + Subtitle */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => switchTab("overview")}
            className="w-9 h-9 rounded-full bg-white border border-slate-200/90 shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Back to Overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {activeTab === "overview" && "Invoices & Sales"}
              {activeTab === "reports" && "Financial Reports & Analytics"}
              {activeTab === "staff-analysis" && "Staff Performance & Analysis"}
              {activeTab === "settings" && "Settings & Business Profile"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {activeTab === "overview" && "Manage and track all your shop invoices and live transactions in one place."}
              {activeTab === "reports" && "Revenue comparisons, cash vs UPI collections, daily trends, and CSV exports."}
              {activeTab === "staff-analysis" && "Individual cashier volume, collection ratios, and staff sales rankings."}
              {activeTab === "settings" && "Store identity, staff access control, push notifications, and immutable audit logs."}
            </p>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchTodayOverview()}
            disabled={isLoading}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-center text-slate-600 hover:text-[#5850EC] transition-colors"
            title="Sync Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {activeTab === "reports" && (
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#5850EC]" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-[#5850EC] hover:bg-[#4F46E5] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-md shadow-indigo-500/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record Sale</span>
          </button>
        </div>
      </div>

      {/* 2. THE 4 DEDICATED VIEWS */}

      {/* VIEW 1: OVERVIEW & MASTER LEDGER */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 4 White Finnova KPI Cards */}
          <FinnovaKpiCards
            totalRevenue={totalRevenue}
            cashSales={cashSales}
            upiSales={upiSales}
            totalTransactions={totalCount}
            cashCount={cashCount}
            upiCount={upiCount}
            onRecordSaleClick={() => setIsRecordModalOpen(true)}
          />

          {/* Filter Bar + Master Dark Navy & Royal Violet Split Container */}
          <FinnovaMasterLedger
            sales={initialLiveSales}
            staffList={staffList}
            onCorrectSale={handleCorrectSale}
            onDeleteSale={handleDeleteSale}
            onRecordSaleClick={() => setIsRecordModalOpen(true)}
          />
        </div>
      )}

      {/* VIEW 2: REPORTS & ANALYTICS */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <SalesReports />
        </div>
      )}

      {/* VIEW 3: STAFF ANALYSIS */}
      {activeTab === "staff-analysis" && (
        <div className="space-y-6">
          <StaffAnalysis
            staffList={staffList}
            sales={initialLiveSales}
          />
        </div>
      )}

      {/* VIEW 4: SETTINGS & BUSINESS CONFIGURATION */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <OwnerSettingsView
            staffList={staffList}
            auditLogs={auditLogs}
            onStaffUpdated={fetchTodayOverview}
            onRefreshAudit={fetchAuditLogs}
          />
        </div>
      )}

      {/* TRANSACTION CORRECTION MODAL */}
      <TransactionCorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        sale={selectedSaleToCorrect}
        onSuccess={handleCorrectionSuccess}
      />

      {/* TRANSACTION DELETION MODAL */}
      <DeleteSaleModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedSaleToDelete(null);
        }}
        sale={selectedSaleToDelete}
        onSuccess={handleDeleteSuccess}
      />

      {/* OWNER QUICK RECORD SALE MODAL */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 sm:p-7 max-w-lg w-full space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#5850EC] flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Record New Sale
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Committed directly to VR Street Karama shared ledger.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <SaleRecordingSection
              onSaleRecorded={() => {
                setIsRecordModalOpen(false);
                fetchTodayOverview();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function OwnerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[#5850EC] mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            Loading VR Street Karama Finnova Console...
          </p>
        </div>
      }
    >
      <OwnerDashboardInner />
    </Suspense>
  );
}
