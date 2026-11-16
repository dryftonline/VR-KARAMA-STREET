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
      return NextResponse.json(
        { error: "Forbidden: Staff list is restricted to the Owner." },
        { status: 403 }
      );
    }

    const { data: staffList, error } = await adminClient
      .from("profiles")
      .select("id, full_name, email, role, is_active, created_at, updated_at")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ staff: staffList || [] });
  } catch (error: any) {
    console.error("Error in /api/staff/list:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
