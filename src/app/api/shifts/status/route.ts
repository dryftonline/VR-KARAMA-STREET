import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBusinessDateKolkata } from "@/lib/utils/timezone";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
      .select("id, role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_active) {
      return NextResponse.json({ error: "Account inactive" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") || getBusinessDateKolkata();

    if (profile.role === "STAFF") {
      // Staff can only see their own shift
      const { data: shift, error } = await supabase
        .from("staff_shifts")
        .select("*")
        .eq("staff_id", user.id)
        .eq("business_date", dateParam)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        shift: shift || null,
        businessDate: dateParam,
      });
    } else {
      // Owner can see all shifts for that business date
      const { data: shifts, error } = await supabase
        .from("staff_shifts")
        .select("id, staff_id, business_date, opening_time, opening_photo_url, closing_time, closing_photo_url, created_at, updated_at, profiles(id, full_name, email)")
        .eq("business_date", dateParam)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const formattedShifts = (shifts || []).map((s: any) => ({
        id: s.id,
        staff_id: s.staff_id,
        business_date: s.business_date,
        opening_time: s.opening_time,
        opening_photo_url: s.opening_photo_url,
        closing_time: s.closing_time,
        closing_photo_url: s.closing_photo_url,
        created_at: s.created_at,
        updated_at: s.updated_at,
        staff_name: s.profiles?.full_name || "Unknown Staff",
        staff_email: s.profiles?.email || null,
      }));

      return NextResponse.json({
        shifts: formattedShifts,
        businessDate: dateParam,
      });
    }
  } catch (error: any) {
    console.error("Error in /api/shifts/status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
