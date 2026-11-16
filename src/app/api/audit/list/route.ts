import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "OWNER" || !profile.is_active) {
      return NextResponse.json({ error: "Forbidden: Owner only" }, { status: 403 });
    }

    const { data: logs, error } = await supabase
      .from("audit_logs")
      .select("id, actor_id, action, target_type, target_id, details, created_at, profiles(full_name, role)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (logs || []).map((l: any) => ({
      id: l.id,
      actor_id: l.actor_id,
      actor_name: l.profiles?.full_name || "System / Admin",
      action: l.action,
      target_type: l.target_type,
      target_id: l.target_id,
      details: l.details,
      created_at: l.created_at,
    }));

    return NextResponse.json({ auditLogs: formatted });
  } catch (error: any) {
    console.error("Error in /api/audit/list:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
