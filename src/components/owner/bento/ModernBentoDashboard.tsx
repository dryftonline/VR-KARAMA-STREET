"use client";

import { HeroGreetingCard } from "./HeroGreetingCard";
import { DateWeatherCard } from "./DateWeatherCard";
import { RevenueRadialCard } from "./RevenueRadialCard";
import { PaymentSplitCard } from "./PaymentSplitCard";
import { LiveLedgerCard } from "./LiveLedgerCard";
import { SalesVelocityWaveCard } from "./SalesVelocityWaveCard";
import { WeeklyActivityCard } from "./WeeklyActivityCard";
import { ShortcutsCard } from "./ShortcutsCard";
import { StaffLeaderboardCard } from "./StaffLeaderboardCard";
import { SystemStatusCard } from "./SystemStatusCard";
import { Sale, Profile } from "@/lib/types";

interface ModernBentoDashboardProps {
  summaryData: any;
  sales: Sale[];
  staffList: Profile[];
  profile: Profile | null;
  onCorrectSale?: (sale: Sale) => void;
  onSelectShortcut?: (tabId: string) => void;
  onSyncLedger?: () => void;
}

export function ModernBentoDashboard({
  summaryData,
  sales = [],
  staffList = [],
  profile,
  onCorrectSale,
  onSelectShortcut,
  onSyncLedger,
}: ModernBentoDashboardProps) {
  const totalRevenue = summaryData?.totalRevenue || 0;
  const cashSales = summaryData?.cashSales || 0;
  const upiSales = summaryData?.upiSales || 0;
  const cashCount = summaryData?.cashCount || 0;
  const upiCount = summaryData?.upiCount || 0;
  const totalTransactions = summaryData?.totalTransactions || 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ROW 1: Hero Greeting & Date/Weather */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-7">
          <HeroGreetingCard
            fullName={profile?.full_name || "Aaru"}
            totalTransactions={totalTransactions}
          />
        </div>
        <div className="md:col-span-5">
          <DateWeatherCard />
        </div>
      </div>

      {/* ROW 2: Productivity/Revenue Radial & Focus Timer/Payment Velocity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <RevenueRadialCard
          totalRevenue={totalRevenue}
          cashSales={cashSales}
          upiSales={upiSales}
          cashCount={cashCount}
          upiCount={upiCount}
          totalTransactions={totalTransactions}
        />
        <PaymentSplitCard onQuickAction={onSyncLedger} />
      </div>

      {/* ROW 3: Tasks/Live Ledger & Current Mood/Sales Velocity Wave */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <LiveLedgerCard
          sales={sales}
          onCorrectSale={onCorrectSale}
          onAddQuickSale={() => onSelectShortcut && onSelectShortcut("ledger")}
        />
        <SalesVelocityWaveCard
          activeStaffCount={staffList.filter((s) => s.role === "STAFF" && s.is_active).length}
          avgTicket={totalTransactions > 0 ? `₹${Math.round(totalRevenue / totalTransactions)}` : "₹0"}
        />
      </div>

      {/* ROW 4: Weekly Activity Bar Chart & Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <WeeklyActivityCard />
        <ShortcutsCard onSelectAction={(id) => onSelectShortcut && onSelectShortcut(id)} />
      </div>

      {/* ROW 5: Upcoming Events/Staff Roster & System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <StaffLeaderboardCard
          staffList={staffList}
          onViewAll={() => onSelectShortcut && onSelectShortcut("staff")}
        />
        <SystemStatusCard />
      </div>
    </div>
  );
}

