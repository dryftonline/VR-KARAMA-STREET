import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Fetch caller profile to determine role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_active) {
      return NextResponse.json({ error: "Account inactive or invalid" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const paymentMethod = searchParams.get("paymentMethod");
    const staffIdParam = searchParams.get("staffId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);

    let query = supabase
      .from("sales")
      .select("id, transaction_number, staff_id, amount, payment_method, business_date, notes, created_at, profiles(id, full_name, email)")
      .order("created_at", { ascending: false })
      .limit(limit);

    // SECURITY: If user is STAFF, enforce filtering strictly by their own user ID!
    if (profile.role === "STAFF") {
      query = query.eq("staff_id", user.id);
    } else if (profile.role === "OWNER") {
      // Owner can filter by any staff member
      if (staffIdParam && staffIdParam !== "ALL") {
        query = query.eq("staff_id", staffIdParam);
      }
    }

    if (startDate) {
      query = query.gte("business_date", startDate);
    }
    if (endDate) {
      query = query.lte("business_date", endDate);
    }
    if (paymentMethod && (paymentMethod === "CASH" || paymentMethod === "UPI")) {
      query = query.eq("payment_method", paymentMethod);
    }

    const { data: sales, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching sales:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Format sales response cleanly
    const formattedSales = (sales || []).map((s: any) => ({
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
    }));

    return NextResponse.json({ sales: formattedSales });
  } catch (error: any) {
    console.error("Error in /api/sales/live:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
