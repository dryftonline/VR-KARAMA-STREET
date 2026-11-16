import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * VR Street Karama - System Setup API
 * Allows initializing the primary Owner account if no profiles exist yet,
 * or provisioning standard test accounts in development mode.
 */
export async function POST(request: Request) {
  try {
    const adminClient = getSupabaseAdminClient();

    // Check if any owner already exists
    const { count: ownerCount } = await adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "OWNER");

    const body = await request.json().catch(() => ({}));
    const { email, password, fullName, secretKey } = body;

    // If an owner already exists, require the SUPABASE_SERVICE_ROLE_KEY as a secret
    if (ownerCount && ownerCount > 0) {
      if (secretKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json(
          { error: "Setup is locked: An Owner already exists. Provide service secret key to proceed." },
          { status: 403 }
        );
      }
    }

    const ownerEmail = email || "owner@vrstreetkarama.com";
    const ownerPassword = password || "Karama@2026!";
    const ownerName = fullName || "VR Karama Owner";

    // 1. Create or fetch user in Supabase Auth
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
      user_metadata: {
        full_name: ownerName,
        role: "OWNER",
      },
    });

    let userId = userData?.user?.id;

    if (createError) {
      // If user already exists in auth, find them
      const { data: usersList } = await adminClient.auth.admin.listUsers();
      const existing = usersList?.users?.find((u) => u.email === ownerEmail);
      if (existing) {
        userId = existing.id;
        // Update their password
        await adminClient.auth.admin.updateUserById(userId, { password: ownerPassword });
      } else {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Could not create or locate owner user." }, { status: 500 });
    }

    // 2. Upsert profile as OWNER
    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: userId,
      full_name: ownerName,
      email: ownerEmail,
      role: "OWNER",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 3. Log setup in audit logs
    await adminClient.from("audit_logs").insert({
      actor_id: userId,
      action: "INITIALIZE_SYSTEM_OWNER",
      target_type: "OWNER",
      target_id: userId,
      details: { email: ownerEmail },
    });

    return NextResponse.json({
      success: true,
      message: "Owner account successfully configured.",
      credentials: {
        email: ownerEmail,
        role: "OWNER",
      },
    });
  } catch (error: any) {
    console.error("System setup error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

