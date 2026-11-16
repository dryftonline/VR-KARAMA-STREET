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

    // Verify caller is an active OWNER
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", caller.id)
      .single();

    if (!callerProfile || callerProfile.role !== "OWNER" || !callerProfile.is_active) {
      return NextResponse.json(
        { error: "Forbidden: Only active owners can delete staff accounts" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const staffId = body.staffId;

    if (!staffId) {
      return NextResponse.json({ error: "Missing required parameter: staffId" }, { status: 400 });
    }

    if (staffId === caller.id) {
      return NextResponse.json(
        { error: "Forbidden: You cannot delete your own Owner account." },
        { status: 403 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    // Fetch target profile
    const { data: targetProfile, error: targetError } = await adminClient
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", staffId)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    if (targetProfile.role === "OWNER") {
      return NextResponse.json(
        { error: "Forbidden: Owner accounts cannot be deleted." },
        { status: 403 }
      );
    }

    // Check if staff has recorded sales
    const { count: salesCount } = await adminClient
      .from("sales")
      .select("*", { count: "exact", head: true })
      .eq("staff_id", staffId);

    if (salesCount && salesCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete staff member who has ${salesCount} transaction(s) recorded in the sales ledger. Please deactivate this account instead to preserve financial audit compliance.`,
        },
        { status: 400 }
      );
    }

    // Check if staff has shifts
    const { count: shiftCount } = await adminClient
      .from("staff_shifts")
      .select("*", { count: "exact", head: true })
      .eq("staff_id", staffId);

    if (shiftCount && shiftCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete staff member who has ${shiftCount} shift record(s). Please deactivate their account instead.`,
        },
        { status: 400 }
      );
    }

    // 1. Delete from profiles
    const { error: profileDeleteError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", staffId);

    if (profileDeleteError) {
      console.error("Error deleting staff profile:", profileDeleteError);
      return NextResponse.json(
        { error: "Failed to delete profile: " + profileDeleteError.message },
        { status: 500 }
      );
    }

    // 2. Delete from Supabase Auth
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(staffId);
    if (authDeleteError) {
      console.warn("Notice: Auth user delete warning:", authDeleteError.message);
    }

    // 3. Log audit event
    await adminClient.from("audit_logs").insert({
      actor_id: caller.id,
      action: "DELETE_STAFF_ACCOUNT",
      target_type: "STAFF",
      target_id: staffId,
      details: {
        deleted_name: targetProfile.full_name,
        deleted_email: targetProfile.email,
        deleted_username: targetProfile.email?.split("@")[0] || "",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Staff member "${targetProfile.full_name}" has been permanently deleted.`,
    });
  } catch (error: any) {
    console.error("Error deleting staff account:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
