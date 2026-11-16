import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

    // Verify caller is an active OWNER
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "OWNER" || !profile.is_active) {
      return NextResponse.json(
        { error: "Forbidden: Only active owners can delete sale transactions." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const saleId = body.saleId;
    const reason = body.reason || "Deleted by Owner";

    if (!saleId) {
      return NextResponse.json({ error: "Missing required parameter: saleId" }, { status: 400 });
    }

    // Fetch existing sale details for immutable audit log
    const { data: existingSale, error: fetchError } = await adminClient
      .from("sales")
      .select("id, transaction_number, staff_id, amount, payment_method, business_date, created_at, profiles(full_name)")
      .eq("id", saleId)
      .single();

    if (fetchError || !existingSale) {
      return NextResponse.json({ error: "Sale record not found." }, { status: 404 });
    }

    // 1. Delete from sales table (CASCADE automatically cleans up notification_logs)
    const { error: deleteError } = await adminClient
      .from("sales")
      .delete()
      .eq("id", saleId);

    if (deleteError) {
      console.error("Error deleting sale:", deleteError);
      return NextResponse.json({ error: "Failed to delete sale: " + deleteError.message }, { status: 500 });
    }

    // 2. Insert audit log entry
    await adminClient.from("audit_logs").insert({
      actor_id: user.id,
      action: "DELETE_SALE_TRANSACTION",
      target_type: "SALE",
      target_id: saleId,
      details: {
        transaction_number: existingSale.transaction_number,
        amount: existingSale.amount,
        payment_method: existingSale.payment_method,
        staff_id: existingSale.staff_id,
        staff_name: (existingSale as any).profiles?.full_name || "Unknown Staff",
        business_date: existingSale.business_date,
        reason: String(reason).trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Transaction ${existingSale.transaction_number} was permanently deleted.`,
      deletedSale: {
        id: existingSale.id,
        transactionNumber: existingSale.transaction_number,
        amount: existingSale.amount,
      },
    });
  } catch (error: any) {
    console.error("Error deleting sale:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

