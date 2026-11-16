"use client";

import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6 text-white">
      <div className="max-w-md w-full bg-navy-900 border border-navy-700/60 rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-navy-800 border border-gold/30 flex items-center justify-center mx-auto text-gold animate-pulse-subtle">
          <WifiOff className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            You Are Offline
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            VR Street Karama requires an active internet connection to ensure real-time ledger consistency, fraud prevention, and instant push notification delivery.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/50 text-xs text-amber-300/90 text-left">
          <strong>Note:</strong> Sales submissions and shift records cannot be committed offline. Please check your Wi-Fi or mobile data connection and try again.
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-medium bg-gold hover:bg-gold-400 text-navy-950 transition-colors shadow-gold"
        >
          <RefreshCw className="w-4 h-4" />
          Reconnect Now
        </button>
      </div>
    </div>
  );
}

