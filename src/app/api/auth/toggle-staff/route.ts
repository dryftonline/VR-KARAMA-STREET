import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user: caller },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify caller is active OWNER
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", caller.id)
      .single();

    if (!callerProfile || callerProfile.role !== "OWNER" || !callerProfile.is_active) {
      return NextResponse.json(
        { error: "Forbidden: Only active owners can manage staff status" },
        { status: 403 }
      );
    }

    const { staffId, isActive } = await request.json();

    if (!staffId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: staffId, isActive" },
        { status: 400 }
      );
    }

    // Protect against self-deactivation if owner
    if (staffId === caller.id) {
      return NextResponse.json(
        { error: "Owner cannot deactivate their own account" },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    const { data: targetProfile, error: fetchErr } = await adminClient
      .from("profiles")
      .select("role, full_name, email")
      .eq("id", staffId)
      .single();

    if (fetchErr || !targetProfile) {
      return NextResponse.json({ error: "Staff profile not found" }, { status: 404 });
    }

    // Update active status
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", staffId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Audit log
    await adminClient.from("audit_logs").insert({
      actor_id: caller.id,
      action: isActive ? "ACTIVATE_STAFF" : "DEACTIVATE_STAFF",
      target_type: "STAFF",
      target_id: staffId,
      details: {
        staff_name: targetProfile.full_name,
        staff_email: targetProfile.email,
        is_active: isActive,
      },
    });

    return NextResponse.json({ success: true, staffId, isActive });
  } catch (error: any) {
    console.error("Error toggling staff status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

