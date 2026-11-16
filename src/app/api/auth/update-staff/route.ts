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
        { error: "Forbidden: Only active owners can edit staff accounts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { staffId, fullName, username, password, isActive } = body;

    if (!staffId) {
      return NextResponse.json({ error: "Missing required parameter: staffId" }, { status: 400 });
    }

    const adminClient = getSupabaseAdminClient();

    // Fetch existing profile
    const { data: targetProfile, error: targetError } = await adminClient
      .from("profiles")
      .select("id, full_name, email, role, is_active")
      .eq("id", staffId)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    const profileUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    const authUpdates: Record<string, any> = {
      user_metadata: {},
    };

    if (fullName && typeof fullName === "string") {
      profileUpdates.full_name = fullName.trim();
      authUpdates.user_metadata.full_name = fullName.trim();
    }

    if (typeof isActive === "boolean") {
      profileUpdates.is_active = isActive;
    }

    // Handle username update if provided
    let updatedUsername = targetProfile.email ? targetProfile.email.split("@")[0] : "";
    if (username && typeof username === "string") {
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
      if (cleanUsername.length < 3) {
        return NextResponse.json(
          { error: "Username must be at least 3 alphanumeric characters." },
          { status: 400 }
        );
      }

      const targetEmail = `${cleanUsername}@vrstreetkarama.com`;

      // Check if another profile is already using this username
      const { data: duplicateProfile } = await adminClient
        .from("profiles")
        .select("id")
        .eq("email", targetEmail)
        .neq("id", staffId)
        .maybeSingle();

      if (duplicateProfile) {
        return NextResponse.json(
          { error: `The username "${cleanUsername}" is already taken.` },
          { status: 400 }
        );
      }

      profileUpdates.email = targetEmail;
      authUpdates.email = targetEmail;
      authUpdates.user_metadata.username = cleanUsername;
      updatedUsername = cleanUsername;
    }

    // Handle password update if provided
    if (password && typeof password === "string" && password.trim().length > 0) {
      if (password.trim().length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long." },
          { status: 400 }
        );
      }
      authUpdates.password = password.trim();
    }

    // 1. Update Supabase Auth user if there are auth changes
    if (Object.keys(authUpdates).length > 0) {
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
        staffId,
        authUpdates
      );

      if (authUpdateError) {
        console.error("Failed to update auth credentials:", authUpdateError);
        return NextResponse.json(
          { error: "Failed to update authentication: " + authUpdateError.message },
          { status: 500 }
        );
      }
    }

    // 2. Update profiles table
    const { error: profileUpdateError } = await adminClient
      .from("profiles")
      .update(profileUpdates)
      .eq("id", staffId);

    if (profileUpdateError) {
      console.error("Failed to update profile:", profileUpdateError);
      return NextResponse.json(
        { error: "Failed to update profile record: " + profileUpdateError.message },
        { status: 500 }
      );
    }

    // 3. Log audit event
    await adminClient.from("audit_logs").insert({
      actor_id: caller.id,
      action: "UPDATE_STAFF_ACCOUNT",
      target_type: "STAFF",
      target_id: staffId,
      details: {
        staff_username: updatedUsername,
        full_name: profileUpdates.full_name || targetProfile.full_name,
        password_changed: Boolean(password && password.trim().length > 0),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Staff member details updated successfully.",
      user: {
        id: staffId,
        username: updatedUsername,
        fullName: profileUpdates.full_name || targetProfile.full_name,
        isActive: profileUpdates.is_active !== undefined ? profileUpdates.is_active : targetProfile.is_active,
      },
    });
  } catch (error: any) {
    console.error("Error updating staff member:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
