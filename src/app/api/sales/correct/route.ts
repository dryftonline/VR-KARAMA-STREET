import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isValidMonetaryAmount } from "@/lib/utils/currency";

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "OWNER" || !profile.is_active) {
      return NextResponse.json(
        { error: "Forbidden: Only active owners can perform transaction corrections" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { saleId, amount, paymentMethod, reason } = body;

    if (!saleId || !reason || String(reason).trim().length < 5) {
      return NextResponse.json(
        { error: "A detailed correction reason (at least 5 characters) is mandatory." },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    // Fetch existing sale
    const { data: existingSale, error: saleErr } = await adminClient
      .from("sales")
      .select("*")
      .eq("id", saleId)
      .single();

    if (saleErr || !existingSale) {
      return NextResponse.json({ error: "Sale record not found" }, { status: 404 });
    }

    const updates: Record<string, any> = {};

    if (amount !== undefined) {
      if (!isValidMonetaryAmount(amount)) {
        return NextResponse.json({ error: "Invalid amount value." }, { status: 400 });
      }
      updates.amount = parseFloat(parseFloat(amount).toFixed(2));
    }

    if (paymentMethod !== undefined) {
      if (paymentMethod !== "CASH" && paymentMethod !== "UPI") {
        return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
      }
      updates.payment_method = paymentMethod;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No changes provided." }, { status: 400 });
    }

    // Apply update to sales
    const { data: updatedSale, error: updateError } = await adminClient
      .from("sales")
      .update(updates)
      .eq("id", saleId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Insert immutable audit log
    await adminClient.from("audit_logs").insert({
      actor_id: user.id,
      action: "CORRECT_SALE_TRANSACTION",
      target_type: "SALE",
      target_id: saleId,
      details: {
        transaction_number: existingSale.transaction_number,
        before: {
          amount: existingSale.amount,
          payment_method: existingSale.payment_method,
        },
        after: {
          amount: updatedSale.amount,
          payment_method: updatedSale.payment_method,
        },
        reason: String(reason).trim(),
      },
    });

    return NextResponse.json({ success: true, sale: updatedSale });
  } catch (error: any) {
    console.error("Error correcting sale:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

