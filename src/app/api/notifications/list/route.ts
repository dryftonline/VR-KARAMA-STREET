import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "OWNER" || !profile.is_active) {
      return NextResponse.json({ error: "Forbidden: Owner only" }, { status: 403 });
    }

    const { data: devices, error: devError } = await adminClient
      .from("notification_devices")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (devError) {
      return NextResponse.json({ error: devError.message }, { status: 500 });
    }

    const { data: recentLogs } = await adminClient
      .from("notification_logs")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      devices: devices || [],
      recentLogs: recentLogs || [],
    });
  } catch (error: any) {
    console.error("Error in /api/notifications/list:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
