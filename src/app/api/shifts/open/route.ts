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
    const serverOpeningTime = new Date().toISOString();

    const adminClient = getSupabaseAdminClient();

    // 1. Check if shift already exists for this staff and business date
    const { data: existingShift } = await adminClient
      .from("staff_shifts")
      .select("id, opening_time, closing_time")
      .eq("staff_id", user.id)
      .eq("business_date", businessDate)
      .maybeSingle();

    if (existingShift && existingShift.opening_time) {
      return NextResponse.json(
        { error: "Opening record has already been submitted for today's shift." },
        { status: 409 }
      );
    }

    // Handle photo: could be FormData (multipart) or JSON with existing photo path
    let photoPath = "";
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("photo") as File | null;

      if (file && file.size > 0) {
        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `${user.id}/opening_${businessDate}_${Date.now()}.${fileExt}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadErr } = await adminClient.storage
          .from("shift-photos")
          .upload(fileName, buffer, {
            contentType: file.type || "image/jpeg",
            upsert: true,
          });

        if (uploadErr) {
          console.error("Failed to upload opening photo:", uploadErr);
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
      // Update existing record
      const { data, error } = await adminClient
        .from("staff_shifts")
        .update({
          opening_time: serverOpeningTime,
          opening_photo_url: photoPath || null,
          updated_at: serverOpeningTime,
        })
        .eq("id", existingShift.id)
        .select()
        .single();

      if (error) throw error;
      shiftResult = data;
    } else {
      // Insert new shift record
      const { data, error } = await adminClient
        .from("staff_shifts")
        .insert({
          staff_id: user.id,
          business_date: businessDate,
          opening_time: serverOpeningTime,
          opening_photo_url: photoPath || null,
          created_at: serverOpeningTime,
          updated_at: serverOpeningTime,
        })
        .select()
        .single();

      if (error) throw error;
      shiftResult = data;
    }

    return NextResponse.json({
      success: true,
      shift: shiftResult,
      message: "Opening shift recorded successfully.",
    });
  } catch (error: any) {
    console.error("Error submitting opening shift:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

