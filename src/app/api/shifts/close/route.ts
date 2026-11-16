import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getBusinessDateKolkata } from "@/lib/utils/timezone";

export async function POST(request: Request) {
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
      .select("id, full_name, role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_active) {
      return NextResponse.json({ error: "Account inactive" }, { status: 403 });
    }

    const businessDate = getBusinessDateKolkata();
    const serverClosingTime = new Date().toISOString();

    const adminClient = getSupabaseAdminClient();

    // 1. Check if shift exists
    const { data: existingShift } = await adminClient
      .from("staff_shifts")
      .select("id, opening_time, closing_time")
      .eq("staff_id", user.id)
      .eq("business_date", businessDate)
      .maybeSingle();

    if (existingShift && existingShift.closing_time) {
      return NextResponse.json(
        { error: "Closing record has already been submitted for today's shift." },
        { status: 409 }
      );
    }

    // Handle photo: FormData or JSON
    let photoPath = "";
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("photo") as File | null;

      if (file && file.size > 0) {
        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `${user.id}/closing_${businessDate}_${Date.now()}.${fileExt}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadErr } = await adminClient.storage
          .from("shift-photos")
          .upload(fileName, buffer, {
            contentType: file.type || "image/jpeg",
            upsert: true,
          });

        if (uploadErr) {
          console.error("Failed to upload closing photo:", uploadErr);
          return NextResponse.json(
            { error: "Failed to upload photo: " + uploadErr.message },
            { status: 500 }
          );
        }
        photoPath = fileName;
      }
    } else {
      const body = await request.json().catch(() => ({}));
      photoPath = body.photoPath || "";
    }

    let shiftResult;
    if (existingShift) {
      const { data, error } = await adminClient
        .from("staff_shifts")
        .update({
          closing_time: serverClosingTime,
          closing_photo_url: photoPath || null,
          updated_at: serverClosingTime,
        })
        .eq("id", existingShift.id)
        .select()
        .single();

      if (error) throw error;
      shiftResult = data;
    } else {
      // If staff didn't record opening but is recording closing
      const { data, error } = await adminClient
        .from("staff_shifts")
        .insert({
          staff_id: user.id,
          business_date: businessDate,
          closing_time: serverClosingTime,
          closing_photo_url: photoPath || null,
          created_at: serverClosingTime,
          updated_at: serverClosingTime,
        })
        .select()
        .single();

      if (error) throw error;
      shiftResult = data;
    }

    return NextResponse.json({
      success: true,
      shift: shiftResult,
      message: "Closing shift recorded successfully.",
    });
  } catch (error: any) {
    console.error("Error submitting closing shift:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

