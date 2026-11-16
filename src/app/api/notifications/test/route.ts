import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendSalePushNotificationToOwners } from "@/lib/firebase/admin";

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "OWNER" || !profile.is_active) {
      return NextResponse.json({ error: "Forbidden: Owner only" }, { status: 403 });
    }

    // Trigger a test notification
    const testResult = await sendSalePushNotificationToOwners({
      saleId: "test-" + Date.now(),
      transactionNumber: "VRK-TEST-9999",
      amount: 850.0,
      paymentMethod: "UPI",
      staffName: "Test Staff",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, result: testResult });
  } catch (error: any) {
    console.error("Error sending test notification:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

