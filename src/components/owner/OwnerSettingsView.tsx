"use client";

import { useState } from "react";
import {
  Settings,
  Store,
  Users,
  Bell,
  ShieldCheck,
  Globe,
  Clock,
  Database,
  Key,
} from "lucide-react";
import { StaffManagement } from "@/components/owner/StaffManagement";
import { DeviceNotificationManager } from "@/components/owner/DeviceNotificationManager";
import { Profile } from "@/lib/types";
import { formatDateIST, formatTimeIST } from "@/lib/utils/timezone";

interface OwnerSettingsViewProps {
  staffList: Profile[];
  auditLogs: any[];
  onStaffUpdated: () => void;
  onRefreshAudit: () => void;
}

type SettingsSection = "general" | "staff" | "notifications" | "audit";

export function OwnerSettingsView({
  staffList,
  auditLogs,
  onStaffUpdated,
  onRefreshAudit,
}: OwnerSettingsViewProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");

  const sections = [
    { id: "general", label: "Shop Profile & System", icon: Store },
    { id: "staff", label: "Staff Access & PINs", icon: Users },
    { id: "notifications", label: "Push Alerts & Devices", icon: Bell },
    { id: "audit", label: "Security & Audit Trail", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Settings Header */}
      <div className="finnova-card p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#5850EC]" />
            System &amp; Business Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure shop profile, operational timezone, staff permissions, and device alerts.
          </p>
        </div>

        {/* Section Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-100 border border-slate-200 text-xs">
          {sections.map((s) => {
            const Icon = s.icon;
            const isSelected = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id as SettingsSection)}
                className={`px-3.5 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#5850EC] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Section Content */}

      {/* SECTION 1: GENERAL SHOP CONFIGURATION */}
      {activeSection === "general" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="finnova-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Store className="w-4 h-4 text-[#5850EC]" />
              Store &amp; Outlet Identity
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Business Name</span>
                <span className="font-bold text-slate-900">VR Street Karama</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Outlet</span>
                <span className="font-bold text-[#5850EC]">Karama Branch</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Ledger Model</span>
                <span className="font-semibold text-slate-900">Shared Shop Sales Ledger</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Hosting Provider</span>
                <span className="font-semibold text-slate-900">Vercel Edge Platform</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Database</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" /> Supabase PostgreSQL
                </span>
              </div>
            </div>
          </div>

          <div className="finnova-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#5850EC]" />
              Localization &amp; Currency Format
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Business Timezone</span>
                <span className="font-mono font-bold text-slate-900">Asia/Kolkata (IST, UTC+5:30)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Currency Symbol</span>
                <span className="font-bold text-[#5850EC] font-mono text-sm">₹ (INR)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Number Grouping</span>
                <span className="font-mono text-slate-900">Indian Lakhs/Crores (₹1,25,000.00)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Staff Privacy Enforcement</span>
                <span className="font-bold text-emerald-600">Database Row Level Security (RLS)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Realtime Ledger Sync</span>
                <span className="font-bold text-[#5850EC]">Enabled (Supabase WebSocket)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: STAFF ACCESS & CREDENTIALS */}
      {activeSection === "staff" && (
        <StaffManagement
          staffList={staffList}
          onStaffUpdated={onStaffUpdated}
        />
      )}

      {/* SECTION 3: PUSH NOTIFICATIONS & DEVICES */}
      {activeSection === "notifications" && (
        <DeviceNotificationManager />
      )}

      {/* SECTION 4: AUDIT LOGS */}
      {activeSection === "audit" && (
        <div className="finnova-card p-6 sm:p-7 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Cryptographic &amp; Immutable Audit Trail
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every transaction correction, employee access modification, and security event is recorded with timestamps.
              </p>
            </div>
            <button
              onClick={onRefreshAudit}
              className="text-xs text-[#5850EC] font-bold hover:underline"
            >
              Refresh Audit
            </button>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No audit log entries recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Timestamp (IST)</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500">
                        {formatTimeIST(log.created_at)} ({formatDateIST(log.created_at)})
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-sans font-semibold">
                        {log.actor_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {log.target_type}: {log.target_id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[10px] max-w-xs truncate">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

