import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_active) {
      return NextResponse.json({ error: "Account inactive" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const photoPath = searchParams.get("path");

    if (!photoPath) {
      return NextResponse.json({ error: "Missing photo path" }, { status: 400 });
    }

    // Security Check: If staff, ensure the photo belongs to them
    if (profile.role === "STAFF") {
      const isOwnerOfPhoto = photoPath.startsWith(`${user.id}/`) || photoPath.startsWith(user.id);
      if (!isOwnerOfPhoto) {
        return NextResponse.json(
          { error: "Forbidden: You are not authorized to view other employees' photos." },
          { status: 403 }
        );
      }
    }

    // Generate signed URL with 30-minute expiration
    const adminClient = getSupabaseAdminClient();
    const { data, error } = await adminClient.storage
      .from("shift-photos")
      .createSignedUrl(photoPath, 1800);

    if (error || !data?.signedUrl) {
      console.error("Failed to generate signed URL:", error);
      return NextResponse.json(
        { error: "Failed to generate signed URL: " + (error?.message || "File not found") },
        { status: 404 }
      );
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (error: any) {
    console.error("Error in /api/shifts/photo-url:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
