"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  LayoutGrid,
  TrendingUp,
  Receipt,
  Users,
  ShieldCheck,
  Bell,
  Sun,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";

interface ModernSidebarDockProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  profile: Profile | null;
}

export function ModernSidebarDock({
  activeTab,
  onTabChange,
  profile,
}: ModernSidebarDockProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
      router.refresh();
    } catch (err) {
      window.location.href = "/auth/login";
    }
  };

  const navItems = [
    { id: "overview", icon: Home, label: "Overview" },
    { id: "ledger", icon: LayoutGrid, label: "Live Feed" },
    { id: "reports", icon: TrendingUp, label: "Analytics" },
    { id: "history", icon: Receipt, label: "Transactions" },
    { id: "staff", icon: Users, label: "Staff" },
    { id: "notifications", icon: Bell, label: "Alerts" },
    { id: "audit", icon: ShieldCheck, label: "Audit" },
  ];

  return (
    <aside className="hidden lg:flex flex-col justify-between items-center w-20 py-7 dark-glass-dock shrink-0 h-[calc(100vh-2.5rem)] sticky top-5 z-40">
      {/* Top Brand / Home */}
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Glowing Active Home Button */}
        <button
          onClick={() => onTabChange("overview")}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative group ${
            activeTab === "overview"
              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/40"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
          title="VR Karama Overview"
        >
          <Home className="w-5 h-5" />
          {activeTab === "overview" && (
            <span className="absolute -left-1 w-1.5 h-6 rounded-r-full bg-blue-400 animate-pulse" />
          )}
        </button>

        {/* Nav Items */}
        <nav className="flex flex-col items-center gap-3 w-full px-2">
          {navItems.slice(1).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 relative group ${
                  isActive
                    ? "bg-blue-600/30 text-blue-400 border border-blue-500/40 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
                {isActive && (
                  <span className="absolute -left-1.5 w-1 h-5 rounded-r-full bg-blue-400" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile / Quick Controls */}
      <div className="flex flex-col items-center gap-5 w-full pt-4 border-t border-white/5">
        {/* Quick status dot / Logout */}
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>

        {/* User Avatar Circle */}
        <div
          onClick={() => onTabChange("overview")}
          className="flex flex-col items-center gap-1 cursor-pointer group"
          title={profile?.full_name || "Owner"}
        >
          <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 shadow-md group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-full bg-navy-950 flex items-center justify-center text-white font-bold text-xs">
              {profile?.full_name?.charAt(0) || "V"}
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-medium group-hover:text-white truncate max-w-[60px]">
            {profile?.full_name?.split(" ")[0] || "Owner"}
          </span>
        </div>
      </div>
    </aside>
  );
}

