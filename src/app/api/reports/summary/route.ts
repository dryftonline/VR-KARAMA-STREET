import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBusinessDateKolkata } from "@/lib/utils/timezone";
import { safeAdd } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "OWNER" || !profile.is_active) {
      return NextResponse.json(
        { error: "Forbidden: Financial reports are strictly restricted to the Owner." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || getBusinessDateKolkata();
    const endDate = searchParams.get("endDate") || getBusinessDateKolkata();
    const staffIdParam = searchParams.get("staffId");

    // Fetch all sales within the range
    let query = supabase
      .from("sales")
      .select("id, transaction_number, staff_id, amount, payment_method, business_date, created_at, profiles(id, full_name)")
      .gte("business_date", startDate)
      .lte("business_date", endDate);

    if (staffIdParam && staffIdParam !== "ALL") {
      query = query.eq("staff_id", staffIdParam);
    }

    const { data: sales, error: salesError } = await query;

    if (salesError) {
      return NextResponse.json({ error: salesError.message }, { status: 500 });
    }

    const allSales = sales || [];

    // Decimal-safe accumulation
    let cashPaise = 0;
    let upiPaise = 0;
    let cashCount = 0;
    let upiCount = 0;

    const staffMap = new Map<string, {
      staff_id: string;
      staff_name: string;
      cashPaise: number;
      upiPaise: number;
      count: number;
    }>();

    const dailyMap = new Map<string, {
      date: string;
      cashPaise: number;
      upiPaise: number;
      count: number;
    }>();

    for (const s of allSales) {
      const amountPaise = Math.round(Number(s.amount) * 100);
      const isCash = s.payment_method === "CASH";
      const isUpi = s.payment_method === "UPI";

      if (isCash) {
        cashPaise += amountPaise;
        cashCount += 1;
      } else if (isUpi) {
        upiPaise += amountPaise;
        upiCount += 1;
      }

      // Staff aggregation
      const staffId = s.staff_id;
      const staffName = (s as any).profiles?.full_name || "Unknown";
      if (!staffMap.has(staffId)) {
        staffMap.set(staffId, {
          staff_id: staffId,
          staff_name: staffName,
          cashPaise: 0,
          upiPaise: 0,
          count: 0,
        });
      }
      const staffRecord = staffMap.get(staffId)!;
      if (isCash) staffRecord.cashPaise += amountPaise;
      if (isUpi) staffRecord.upiPaise += amountPaise;
      staffRecord.count += 1;

      // Daily aggregation
      const dateKey = s.business_date;
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          cashPaise: 0,
          upiPaise: 0,
          count: 0,
        });
      }
      const dayRecord = dailyMap.get(dateKey)!;
      if (isCash) dayRecord.cashPaise += amountPaise;
      if (isUpi) dayRecord.upiPaise += amountPaise;
      dayRecord.count += 1;
    }

    const totalRevenue = (cashPaise + upiPaise) / 100;
    const cashSales = cashPaise / 100;
    const upiSales = upiPaise / 100;
    const totalTransactions = cashCount + upiCount;

    const staffSummary = Array.from(staffMap.values()).map((st) => ({
      staff_id: st.staff_id,
      staff_name: st.staff_name,
      total_revenue: (st.cashPaise + st.upiPaise) / 100,
      cash_sales: st.cashPaise / 100,
      upi_sales: st.upiPaise / 100,
      total_transactions: st.count,
    }));

    const dailyBreakdown = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        date: d.date,
        total_revenue: (d.cashPaise + d.upiPaise) / 100,
        cash_sales: d.cashPaise / 100,
        upi_sales: d.upiPaise / 100,
        total_transactions: d.count,
      }));

    return NextResponse.json({
      summary: {
        startDate,
        endDate,
        totalRevenue,
        cashSales,
        upiSales,
        cashCount,
        upiCount,
        totalTransactions,
      },
      dailyBreakdown,
      staffSummary,
      staffBreakdown: staffSummary,
    });
  } catch (error: any) {
    console.error("Error generating sales summary:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
