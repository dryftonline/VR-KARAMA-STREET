"use client";

import { useEffect, useState } from "react";
import { Sparkles, Calendar, Store } from "lucide-react";
import { SaleRecordingSection } from "@/components/staff/SaleRecordingSection";
import { MySalesTodayList } from "@/components/staff/MySalesTodayList";
import { formatDateIST } from "@/lib/utils/timezone";
import { Profile } from "@/lib/types";

export default function StaffDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setProfile(meData.profile);
      }
    } catch (err) {
      console.error("Failed to load staff dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [refreshTrigger]);

  const handleSaleRecorded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-16">
      {/* Welcome Banner (Finnova Style) */}
      <div className="finnova-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-full pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-[#5850EC] text-[11px] font-bold mb-2 border border-indigo-100">
              <Sparkles className="w-3 h-3" /> Staff Cashier Terminal
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Welcome, {profile?.full_name || "Staff Member"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatDateIST(new Date())}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block">
              Outlet
            </span>
            <span className="text-sm font-extrabold text-[#5850EC] flex items-center justify-end gap-1">
              <Store className="w-3.5 h-3.5" /> Karama
            </span>
          </div>
        </div>
      </div>

      {/* Sale Recording Section (Primary Action) */}
      <SaleRecordingSection onSaleRecorded={handleSaleRecorded} />

      {/* My Recent Sales Today (Staff view only) */}
      <MySalesTodayList refreshTrigger={refreshTrigger} />
    </div>
  );
}
