"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if dismissed previously this session
      if (!sessionStorage.getItem("pwa_dismissed")) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem("pwa_dismissed", "true");
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 max-w-sm z-50 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xl animate-fade-in text-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#080B18] border border-slate-700/60 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
            <img
              src="/logo.png"
              alt="VR Street Karama Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">Install App</div>
            <div className="text-xs text-slate-500">
              Add VR Street Karama to your home screen for 1-tap sales access.
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-700 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleInstall}
          className="w-full py-2 text-xs font-bold rounded-xl bg-[#5850EC] hover:bg-[#4F46E5] text-white shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install Now</span>
        </button>
        <button
          onClick={handleDismiss}
          className="py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  );
}

