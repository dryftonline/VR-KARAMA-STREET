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

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "OWNER" || !profile.is_active) {
      return NextResponse.json({ error: "Forbidden: Owner only" }, { status: 403 });
    }

    const { deviceId, isActive } = await request.json();

    if (!deviceId || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const { error } = await adminClient
      .from("notification_devices")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", deviceId)
      .eq("owner_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deviceId, isActive });
  } catch (error: any) {
    console.error("Error toggling notification device:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
