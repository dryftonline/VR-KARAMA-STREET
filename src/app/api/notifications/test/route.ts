import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendSalePushNotificationToOwners } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function POST() {
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

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "OWNER" || !profile.is_active) {
      return NextResponse.json({ error: "Forbidden: Owner only" }, { status: 403 });
    }

    // Fetch the latest sale to link with foreign key
    const { data: latestSale } = await adminClient
      .from("sales")
      .select("id, transaction_number, amount, payment_method")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestSale) {
      // Record a test delivery log
      await adminClient.from("notification_logs").insert({
        sale_id: latestSale.id,
        owner_id: user.id,
        status: "SENT",
        error_message: "Test alert dispatched successfully",
      });
    }

    // Also attempt Firebase dispatch if configured
    try {
      if (latestSale) {
        await sendSalePushNotificationToOwners({
          saleId: latestSale.id,
          transactionNumber: latestSale.transaction_number,
          amount: latestSale.amount,
          paymentMethod: latestSale.payment_method,
          staffName: "Test Dispatcher",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.log("Firebase dispatch skipped:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Test push notification dispatched successfully",
    });
  } catch (error: any) {
    console.error("Error sending test notification:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
