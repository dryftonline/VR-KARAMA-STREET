"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Zap,
  Calendar,
  ShoppingBag,
  SlidersHorizontal,
  Bell,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";

interface NavbarProps {
  profile: Profile | null;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  salesCount?: number;
}

export function Navbar({
  profile,
  activeTab = "overview",
  onTabChange,
  salesCount = 84,
}: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
      router.refresh();
    } catch {
      window.location.href = "/auth/login";
    }
  };

  const navPills = [
    { id: "overview", label: "+ Overview" },
    { id: "feed", label: "Live Stream" },
    { id: "invoices", label: "+ Sales Ledger", activeHighlight: true },
    { id: "reports", label: "Analytics" },
    { id: "staff", label: "Staff Roster" },
    { id: "audit", label: "Audit" },
  ];

  return (
    <header className="w-full pt-4 pb-2 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap lg:flex-nowrap">
        {/* BRAND LOGO (Left) */}
        <div className="flex items-center gap-3">
          <Link
            href={profile?.role === "OWNER" ? "/dashboard/owner" : "/dashboard/staff"}
            className="flex items-center gap-3 group"
          >
            {/* Purple Ribbon Icon (Matches Finnova logo in reference) */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6366F1] via-[#818CF8] to-[#C084FC] flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <span className="font-black text-lg tracking-tighter">VR</span>
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-slate-900 leading-tight">
                VR STREET <span className="text-[#5850EC]">KARAMA</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Sales Ledger &amp; Management
              </div>
            </div>
          </Link>

          {/* Circle Counter Badge */}
          <div className="hidden sm:flex w-8 h-8 rounded-full bg-white border border-slate-200/80 items-center justify-center text-xs font-bold text-slate-700 shadow-sm">
            {salesCount}
          </div>
        </div>

        {/* FLOATING DARK PILL NAVIGATION (Center - Exact Finnova match) */}
        {profile?.role === "OWNER" && (
          <nav className="finnova-nav-pill px-2 py-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar order-3 lg:order-2 w-full lg:w-auto justify-center">
            {navPills.map((p) => {
              const isSelected = activeTab === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onTabChange && onTabChange(p.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    isSelected
                      ? "finnova-active-pill"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* RIGHT UTILITY ICONS & PROFILE (Exact Finnova match) */}
        <div className="flex items-center gap-2 order-2 lg:order-3 ml-auto">
          {/* Action Icons */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => onTabChange && onTabChange("invoices")}
              className="finnova-icon-btn w-9 h-9 flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors"
              title="Ledger"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => onTabChange && onTabChange("overview")}
              className="finnova-icon-btn w-9 h-9 flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors"
              title="Quick Sync"
            >
              <Zap className="w-4 h-4" />
            </button>
            <button
              onClick={() => onTabChange && onTabChange("reports")}
              className="finnova-icon-btn w-9 h-9 flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors"
              title="Calendar"
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => onTabChange && onTabChange("staff")}
              className="finnova-icon-btn w-9 h-9 flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors"
              title="Staff"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
            <button
              onClick={() => onTabChange && onTabChange("audit")}
              className="finnova-icon-btn w-9 h-9 flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors"
              title="Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => onTabChange && onTabChange("notifications")}
              className="finnova-icon-btn w-9 h-9 flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors relative"
              title="Push Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
          </div>

          {/* User Avatar Circle */}
          <div className="flex items-center gap-2 pl-1">
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="finnova-icon-btn w-9 h-9 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#C084FC] p-0.5 shadow-sm">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-slate-800 font-bold text-xs">
                {profile?.full_name?.charAt(0) || "U"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
