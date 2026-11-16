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
      return NextResponse.json(
        { error: "Forbidden: Push notifications can only be registered for Owner devices" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const token = body.token || body.deviceToken;
    const deviceType = body.deviceType || "desktop";
    const deviceName = body.deviceName || "Owner Web Browser";

    if (!token) {
      return NextResponse.json({ error: "Missing device token" }, { status: 400 });
    }

    // Upsert device token
    const { data: device, error: upsertError } = await adminClient
      .from("notification_devices")
      .upsert(
        {
          owner_id: user.id,
          device_token: token,
          device_type: deviceType,
          device_name: deviceName,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "device_token" }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Failed to register device token:", upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, device });
  } catch (error: any) {
    console.error("Error registering notification device:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
