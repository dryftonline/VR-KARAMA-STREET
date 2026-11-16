import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getBusinessDateKolkata } from "@/lib/utils/timezone";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = getSupabaseAdminClient();
    const today = getBusinessDateKolkata();

    // Execute all queries concurrently in parallel on the server
    const [profileRes, todaySalesRes, recentSalesRes, staffRes] = await Promise.all([
      // 1. Owner Profile
      adminClient
        .from("profiles")
        .select("id, full_name, email, role, is_active, created_at, updated_at")
        .eq("id", user.id)
        .single(),

      // 2. Today's Sales for KPI Calculation
      adminClient
        .from("sales")
        .select("amount, payment_method")
        .eq("business_date", today),

      // 3. Recent 50 Sales for Master Ledger
      adminClient
        .from("sales")
        .select("id, transaction_number, staff_id, amount, payment_method, business_date, notes, created_at, profiles(id, full_name, email)")
        .order("created_at", { ascending: false })
        .limit(50),

      // 4. Staff Members
      adminClient
        .from("profiles")
        .select("id, full_name, email, role, is_active, created_at, updated_at")
        .order("created_at", { ascending: true }),
    ]);

    const callerProfile = profileRes.data;
    if (!callerProfile || callerProfile.role !== "OWNER" || !callerProfile.is_active) {
      return NextResponse.json({ error: "Forbidden: Owner dashboard overview restricted to active Owner." }, { status: 403 });
    }

    // Compute Today's KPI Summary in-memory (0ms)
    let cashPaise = 0;
    let upiPaise = 0;
    let cashCount = 0;
    let upiCount = 0;

    for (const s of todaySalesRes.data || []) {
      const paise = Math.round(Number(s.amount) * 100);
      if (s.payment_method === "CASH") {
        cashPaise += paise;
        cashCount += 1;
      } else if (s.payment_method === "UPI") {
        upiPaise += paise;
        upiCount += 1;
      }
    }

    const totalPaise = cashPaise + upiPaise;
    const summary = {
      totalRevenue: totalPaise / 100,
      cashSales: cashPaise / 100,
      upiSales: upiPaise / 100,
      totalTransactions: cashCount + upiCount,
      cashCount,
      upiCount,
    };

    // Format recent sales
    const formattedSales = (recentSalesRes.data || []).map((s: any) => ({
      id: s.id,
      transaction_number: s.transaction_number,
      staff_id: s.staff_id,
      amount: Number(s.amount),
      payment_method: s.payment_method,
      business_date: s.business_date,
      notes: s.notes,
      created_at: s.created_at,
      staff_name: s.profiles?.full_name || "Unknown Staff",
      staff_email: s.profiles?.email || null,
      staff: s.profiles ? { id: s.profiles.id, full_name: s.profiles.full_name, email: s.profiles.email } : undefined,
    }));

    // Format staff list with usernames
    const formattedStaff = (staffRes.data || []).map((m: any) => ({
      ...m,
      username: m.email ? m.email.split("@")[0] : null,
    }));

    return NextResponse.json({
      success: true,
      profile: {
        ...callerProfile,
        username: callerProfile.email ? callerProfile.email.split("@")[0] : null,
      },
      summary,
      sales: formattedSales,
      staff: formattedStaff,
    });
  } catch (error: any) {
    console.error("Error in /api/dashboard/overview:", error);
    return NextResponse.json({ error: error.message || "Failed to load dashboard overview" }, { status: 500 });
  }
}
