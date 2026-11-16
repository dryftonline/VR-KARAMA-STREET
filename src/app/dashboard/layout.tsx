import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/shared/Navbar";
import { PwaInstallBanner } from "@/components/shared/PwaInstallBanner";
import { Profile } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) {
    redirect("/auth/login?error=inactive_account");
  }

  return (
    <div className="min-h-screen bg-[#F4F5F9] flex flex-col text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      <Suspense fallback={<div className="h-20 w-full" />}>
        <Navbar profile={profile as Profile} />
      </Suspense>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {children}
      </main>
      <PwaInstallBanner />
    </div>
  );
}

