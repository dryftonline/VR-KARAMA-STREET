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
    const fullName = String(body.fullName || "").trim();
    const rawUsername = String(body.username || body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();

    if (!fullName || !rawUsername || !password) {
      return NextResponse.json(
        { error: "Missing required fields: fullName, username, and password are required." },
        { status: 400 }
      );
    }

    // Format clean username
    const cleanUsername = rawUsername.includes("@")
      ? rawUsername.split("@")[0].replace(/[^a-z0-9_.-]/g, "")
      : rawUsername.replace(/[^a-z0-9_.-]/g, "");

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 alphanumeric characters (e.g. rahul, staff1)." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const targetEmail = `${cleanUsername}@vrstreetkarama.com`;
    const adminClient = getSupabaseAdminClient();

    // Check if username/email already exists
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", targetEmail)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: `The username "${cleanUsername}" is already taken. Please choose another.` },
        { status: 400 }
      );
    }

    // 1. Create user in Supabase Auth via Admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: targetEmail,
      password,
      email_confirm: true,
      user_metadata: {
        username: cleanUsername,
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
      full_name: fullName,
      email: targetEmail,
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
        staff_username: cleanUsername,
        staff_name: fullName,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        username: cleanUsername,
        full_name: fullName,
        role: "STAFF",
      },
    });
  } catch (error: any) {
    console.error("Error creating staff:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
