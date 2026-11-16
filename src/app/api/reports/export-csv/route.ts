import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatTimeIST, formatDateIST } from "@/lib/utils/timezone";

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
        { error: "Forbidden: Only Owner can export transaction reports" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const staffId = searchParams.get("staffId");
    const paymentMethod = searchParams.get("paymentMethod");

    let query = supabase
      .from("sales")
      .select("id, transaction_number, amount, payment_method, business_date, notes, created_at, profiles(full_name, email)")
      .order("created_at", { ascending: false });

    if (startDate) query = query.gte("business_date", startDate);
    if (endDate) query = query.lte("business_date", endDate);
    if (staffId && staffId !== "ALL") query = query.eq("staff_id", staffId);
    if (paymentMethod && paymentMethod !== "ALL") query = query.eq("payment_method", paymentMethod);

    const { data: sales, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = [
      ["Transaction ID", "Business Date", "Time (IST)", "Staff Name", "Amount (INR)", "Payment Method", "Notes"],
    ];

    for (const s of sales || []) {
      const staffName = (s as any).profiles?.full_name || "Unknown Staff";
      const timeStr = formatTimeIST(s.created_at);
      const noteStr = (s.notes || "").replace(/"/g, '""');

      rows.push([
        s.transaction_number,
        s.business_date,
        timeStr,
        `"${staffName}"`,
        Number(s.amount).toFixed(2),
        s.payment_method,
        `"${noteStr}"`,
      ]);
    }

    const csvContent = rows.map((r) => r.join(",")).join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="VR_Street_Karama_Sales_${startDate || "all"}_to_${endDate || "all"}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("CSV Export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
