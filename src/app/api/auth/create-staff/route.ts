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
        { error: "Forbidden: Only active owners can create staff accounts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, fullName } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, fullName" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    // 1. Create user in Supabase Auth via Admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "STAFF",
      },
    });

    if (createError || !newUser?.user) {
      return NextResponse.json(
        { error: createError?.message || "Failed to create user account" },
        { status: 400 }
      );
    }

    // 2. Insert into profiles table
    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: newUser.user.id,
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      role: "STAFF",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("Error creating staff profile:", profileError);
      return NextResponse.json(
        { error: "User created but failed to initialize profile record: " + profileError.message },
        { status: 500 }
      );
    }

    // 3. Create Audit Log Entry
    await adminClient.from("audit_logs").insert({
      actor_id: caller.id,
      action: "CREATE_STAFF_ACCOUNT",
      target_type: "STAFF",
      target_id: newUser.user.id,
      details: {
        staff_email: email,
        staff_name: fullName,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        full_name: fullName,
        role: "STAFF",
      },
    });
  } catch (error: any) {
    console.error("Error creating staff:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

