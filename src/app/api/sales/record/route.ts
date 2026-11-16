import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isValidMonetaryAmount } from "@/lib/utils/currency";
import { getBusinessDateKolkata } from "@/lib/utils/timezone";
import { sendSalePushNotificationToOwners } from "@/lib/firebase/admin";

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

    // 1. Verify caller profile & active status
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("id, full_name, role, is_active")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 403 });
    }

    if (!profile.is_active) {
      return NextResponse.json(
        { error: "Account is inactive. Please contact the owner." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { amount, paymentMethod, notes } = body;

    // 2. Validate Payment Amount
    if (!isValidMonetaryAmount(amount)) {
      return NextResponse.json(
        { error: "Invalid payment amount. Amount must be a positive number with at most 2 decimal places." },
        { status: 400 }
      );
    }

    const numericAmount = parseFloat(parseFloat(amount).toFixed(2));
    if (numericAmount <= 0) {
      return NextResponse.json(
        { error: "Payment amount must be greater than zero." },
        { status: 400 }
      );
    }

    // 3. Validate Payment Method
    if (paymentMethod !== "CASH" && paymentMethod !== "UPI") {
      return NextResponse.json(
        { error: "Invalid payment method. Must be CASH or UPI." },
        { status: 400 }
      );
    }

    const businessDate = getBusinessDateKolkata();
    const nowIso = new Date().toISOString();

    // 4. Save transaction into Supabase sales table
    // Let database trigger assign transaction_number or construct one
    const { data: insertedSale, error: insertError } = await supabase
      .from("sales")
      .insert({
        staff_id: user.id,
        amount: numericAmount,
        payment_method: paymentMethod,
        business_date: businessDate,
        notes: notes ? String(notes).trim().substring(0, 255) : null,
        created_at: nowIso,
      })
      .select("id, transaction_number, staff_id, amount, payment_method, business_date, created_at")
      .single();

    if (insertError || !insertedSale) {
      console.error("Failed to commit sale record:", insertError);
      return NextResponse.json(
        { error: "Failed to save transaction: " + (insertError?.message || "Unknown error") },
        { status: 500 }
      );
    }

    // 5. Trigger Push Notification to Owners asynchronously in background
    // (Does not block or fail sale response if push notification delivery encounters issues)
    sendSalePushNotificationToOwners({
      saleId: insertedSale.id,
      transactionNumber: insertedSale.transaction_number,
      amount: insertedSale.amount,
      paymentMethod: insertedSale.payment_method,
      staffName: profile.full_name,
      createdAt: insertedSale.created_at,
    }).catch((notifErr) => {
      console.error("Background push notification failed:", notifErr);
    });

    return NextResponse.json({
      success: true,
      sale: {
        id: insertedSale.id,
        transactionNumber: insertedSale.transaction_number,
        amount: insertedSale.amount,
        paymentMethod: insertedSale.payment_method,
        businessDate: insertedSale.business_date,
        createdAt: insertedSale.created_at,
        staffName: profile.full_name,
      },
    });
  } catch (error: any) {
    console.error("Unexpected error in /api/sales/record:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

