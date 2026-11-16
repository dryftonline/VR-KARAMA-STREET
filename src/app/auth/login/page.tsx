"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      setIsLoading(true);
      const supabase = getSupabaseBrowserClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setErrorMessage(error.message);
        toastError(error.message, "Sign In Failed");
        return;
      }

      if (data?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, is_active, full_name")
          .eq("id", data.user.id)
          .single();

        if (profile && !profile.is_active) {
          await supabase.auth.signOut();
          setErrorMessage("This account has been deactivated. Please contact the Owner.");
          toastError("Account Deactivated", "Access Denied");
          return;
        }

        toastSuccess(`Welcome back, ${profile?.full_name || "User"}!`, "Authentication Successful");

        if (profile?.role === "OWNER") {
          router.push("/dashboard/owner");
        } else {
          router.push("/dashboard/staff");
        }
        router.refresh();
      }
    } catch (err: any) {
      console.error("Login unexpected error:", err);
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (role: "owner" | "staff") => {
    if (role === "owner") {
      setEmail("owner@vrstreetkarama.com");
      setPassword("Karama@2026!");
    } else {
      setEmail("staff@vrstreetkarama.com");
      setPassword("Karama@2026!");
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F9] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient purple glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          {/* Official VR Street Karama Neon Goggles Logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#080B18] border border-slate-700/60 shadow-xl shadow-cyan-500/15 mb-2 p-1.5 overflow-hidden">
            <img
              src="/logo.png"
              alt="VR Street Karama Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            VR STREET <span className="text-[#5850EC]">KARAMA</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase">
            Sales Ledger &amp; Management Portal
          </p>
        </div>

        {/* Card Form */}
        <div className="finnova-card p-6 sm:p-8 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Sign In to Your Account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Owner and Staff authentication portal
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@vrstreetkarama.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200 text-slate-900 focus:bg-white"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-slate-50 border-slate-200 text-slate-900 focus:bg-white"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#5850EC] to-[#4F46E5] text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/25 hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 mt-2"
            >
              {isLoading ? "Signing In..." : "Sign In to System"}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
            <span className="text-[11px] text-slate-400">Demo Fill:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill("owner")}
                className="px-2.5 py-1 rounded-full bg-indigo-50 text-[#5850EC] text-[11px] font-semibold hover:bg-indigo-100 border border-indigo-100"
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("staff")}
                className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold hover:bg-slate-200 border border-slate-200"
              >
                Staff
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#5850EC]" />
          <span>Protected with Supabase PostgreSQL Row Level Security (RLS)</span>
        </div>
      </div>
    </div>
  );
}
