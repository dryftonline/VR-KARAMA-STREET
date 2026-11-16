import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendTestWebPushToOwners } from "@/lib/webpush/server";

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
        error_message: "Test background alert dispatched",
      });
    }

    // Send Web Push to registered owner devices
    let pushResult;
    try {
      pushResult = await sendTestWebPushToOwners(user.id);
    } catch (e: any) {
      console.warn("Web push dispatch warning:", e.message);
      // Even if 0 devices are registered, don't crash, report informative message
      return NextResponse.json({
        success: true,
        message: e.message || "Test alert recorded (no registered devices found)",
        warning: e.message,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Test push notification dispatched successfully to ${pushResult.sentCount} device(s)!`,
      result: pushResult,
    });
  } catch (error: any) {
    console.error("Error sending test notification:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
