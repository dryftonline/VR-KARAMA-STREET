import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const usernameInput = String(body.username || "").trim().toLowerCase();

    if (!usernameInput) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const adminClient = getSupabaseAdminClient();

    // If user provided an email with '@'
    if (usernameInput.includes("@")) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("email, is_active, role, full_name")
        .ilike("email", usernameInput)
        .maybeSingle();

      return NextResponse.json({
        success: true,
        email: profile?.email || usernameInput,
        username: usernameInput.split("@")[0],
        isActive: profile ? profile.is_active : true,
      });
    }

    // Standard username resolution (e.g. 'owner' -> 'owner@vrstreetkarama.com')
    const candidateEmail = `${usernameInput}@vrstreetkarama.com`;

    // Check profiles for exact or prefix match
    const { data: profile } = await adminClient
      .from("profiles")
      .select("email, is_active, role, full_name")
      .or(`email.ilike.${candidateEmail},email.ilike.${usernameInput}@%`)
      .maybeSingle();

    const resolvedEmail = profile?.email || candidateEmail;

    return NextResponse.json({
      success: true,
      email: resolvedEmail,
      username: usernameInput,
      isActive: profile ? profile.is_active : true,
    });
  } catch (error: any) {
    console.error("Error resolving username:", error);
    return NextResponse.json({ error: error.message || "Failed to resolve username" }, { status: 500 });
  }
}

