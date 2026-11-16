"use client";

import {
  PlusCircle,
  FileSpreadsheet,
  Users,
  TrendingUp,
  ShieldCheck,
  Bell,
} from "lucide-react";

interface ShortcutsCardProps {
  onSelectAction: (actionId: string) => void;
}

export function ShortcutsCard({ onSelectAction }: ShortcutsCardProps) {
  const shortcuts = [
    { id: "ledger", icon: PlusCircle, label: "Live Feed" },
    { id: "reports", icon: TrendingUp, label: "Analytics" },
    { id: "staff", icon: Users, label: "Staff Roster" },
    { id: "history", icon: FileSpreadsheet, label: "Ledger" },
    { id: "notifications", icon: Bell, label: "Push Alerts" },
    { id: "audit", icon: ShieldCheck, label: "Audit Trail" },
  ];

  return (
    <div className="dark-glass-card p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between min-h-[260px]">
      {/* Header */}
      <div>
        <h4 className="text-sm font-semibold text-white tracking-tight">
          Shortcuts
        </h4>
      </div>

      {/* 2x3 Icon Grid (Exact visual match to Shortcuts in reference image) */}
      <div className="grid grid-cols-3 gap-3 my-auto py-2">
        {shortcuts.map((sc) => {
          const Icon = sc.icon;
          return (
            <button
              key={sc.id}
              onClick={() => onSelectAction(sc.id)}
              className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/15 transition-all duration-200 active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-blue-600/20 text-slate-300 group-hover:text-blue-400 flex items-center justify-center transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-slate-400 group-hover:text-white mt-1.5 truncate max-w-full">
                {sc.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

