"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Smartphone, Laptop, CheckCircle2, AlertTriangle, Send, RefreshCw, Volume2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatTimeIST } from "@/lib/utils/timezone";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// Web Audio API chime synthesizer (Works in all modern browsers without external audio files)
function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Upbeat pleasant two-tone chime (587Hz -> 880Hz)
    playTone(587.33, 0, 0.25);
    playTone(880.0, 0.15, 0.35);
  } catch (e) {
    console.log("Audio chime error:", e);
  }
}

export function DeviceNotificationManager() {
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const [devices, setDevices] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDevicesAndLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notifications/list");
      const data = await res.json();
      if (res.ok) {
        setDevices(data.devices || []);
        setRecentLogs(data.recentLogs || []);
      }
    } catch (err) {
      console.error("Failed to load devices:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionState(Notification.permission);
    }
    fetchDevicesAndLogs();

    // Supabase Realtime Listener for instant sale notifications
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("owner-device-push-alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sales" },
        (payload: any) => {
          const sale = payload.new;
          playNotificationChime();
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("VR Street Karama • Sale Recorded! 💰", {
              body: `₹${sale.amount} received via ${sale.payment_method} | #${sale.transaction_number}`,
              icon: "/logo.png",
              badge: "/logo.png",
              tag: `sale-${sale.id}`,
            });
          }
          toastInfo(
            `₹${sale.amount} received via ${sale.payment_method} (#${sale.transaction_number})`,
            "Live Sale Recorded"
          );
          fetchDevicesAndLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDevicesAndLogs, toastInfo]);

  const handleEnableNotifications = async () => {
    try {
      setIsRegistering(true);

      if (typeof window === "undefined" || !("Notification" in window)) {
        toastError("Browser notifications are not supported on this device/browser.", "Not Supported");
        return;
      }

      // 1. Request permission
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission !== "granted") {
        toastError(
          "Notification permission was denied. Please allow notifications in your browser address bar settings.",
          "Permission Denied"
        );
        return;
      }

      // 2. Retrieve or generate a persistent device token
      let token = localStorage.getItem("vr_device_token");
      if (!token) {
        token = "web_device_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
        localStorage.setItem("vr_device_token", token);
      }

      const deviceType = /Mobi|Android|iPhone/i.test(navigator.userAgent)
        ? "mobile"
        : "desktop";

      const deviceName = `${navigator.userAgent.includes("Chrome") ? "Chrome" : navigator.userAgent.includes("Firefox") ? "Firefox" : "Browser"} on ${
        navigator.platform || "Device"
      }`;

      // 3. Register with server
      const res = await fetch("/api/notifications/register-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceToken: token,
          token,
          deviceType,
          deviceName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register device token");
      }

      // 4. Play chime & show welcome notification
      playNotificationChime();
      new Notification("VR Street Karama - Push Notifications Active! 🔔", {
        body: "This device is registered. Instant alerts will arrive when sales are committed.",
        icon: "/logo.png",
      });

      toastSuccess(
        "This device is now registered to receive instant push alerts for sales!",
        "Device Registered"
      );
      fetchDevicesAndLogs();
    } catch (err: any) {
      console.error("Enable notifications error:", err);
      toastError(err.message, "Registration Failed");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleToggleDevice = async (deviceId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/notifications/toggle-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          isActive: !currentStatus,
        }),
      });

      if (!res.ok) throw new Error("Failed to update device state");

      toastSuccess(
        `Device notifications ${!currentStatus ? "enabled" : "disabled"}.`,
        "Device Updated"
      );
      fetchDevicesAndLogs();
    } catch (err: any) {
      toastError(err.message, "Update Failed");
    }
  };

  const handleSendTest = async () => {
    try {
      setIsSendingTest(true);

      // Play local sound and trigger test notification right now
      playNotificationChime();

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification("VR Street Karama • Test Alert 💰", {
          body: "₹1,500.00 sale recorded via GPay / UPI by Rahul Sharma (Live Test)",
          icon: "/logo.png",
          badge: "/logo.png",
        });
      }

      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([100, 50, 100]);
      }

      const res = await fetch("/api/notifications/test", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to dispatch test notification");

      toastSuccess("Test push notification dispatched to your active devices!", "Test Sent");
      fetchDevicesAndLogs();
    } catch (err: any) {
      toastError(err.message, "Test Dispatch Failed");
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="finnova-card p-6 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#5850EC]" />
            Push Notifications &amp; Device Manager
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant alerts dispatched to your device whenever a sale is committed to the shared sales ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSendTest}
            disabled={isSendingTest}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-95"
          >
            <Send className="w-3.5 h-3.5 text-[#5850EC]" />
            <span>{isSendingTest ? "Sending..." : "Send Test Alert"}</span>
          </button>
          <button
            onClick={fetchDevicesAndLogs}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Primary Action Card: Enable Web Push */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">Current Browser Status:</span>
            {permissionState === "granted" ? (
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Notifications Permitted
              </span>
            ) : permissionState === "denied" ? (
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                <BellOff className="w-3 h-3" /> Permission Blocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                <AlertTriangle className="w-3 h-3" /> Not Enabled Yet
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Realtime sound chime and instant popup notifications on every recorded sale.
          </p>
        </div>

        <button
          onClick={handleEnableNotifications}
          disabled={isRegistering}
          className="px-5 py-2.5 rounded-full bg-[#5850EC] hover:bg-[#4F46E5] text-white text-xs font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-all shrink-0 flex items-center gap-2"
        >
          <Bell className="w-4 h-4" />
          <span>{devices.length > 0 ? "Re-sync Device Token" : "Enable Push on This Device"}</span>
        </button>
      </div>

      {/* Registered Devices List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Registered Owner Devices ({devices.length})
        </h4>

        {devices.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-200/80">
            No devices registered yet. Click &quot;Enable Push on This Device&quot; above to receive alerts.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white">
            {devices.map((dev) => (
              <div
                key={dev.id}
                className="p-3.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#5850EC]">
                    {dev.device_type === "mobile" ? (
                      <Smartphone className="w-4 h-4" />
                    ) : (
                      <Laptop className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {dev.device_name || "Owner Web Device"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Token: ...{dev.device_token.slice(-16)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[11px] font-semibold ${
                      dev.is_active ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {dev.is_active ? "Active" : "Disabled"}
                  </span>
                  <button
                    onClick={() => handleToggleDevice(dev.id, dev.is_active)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                      dev.is_active
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    }`}
                  >
                    {dev.is_active ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Notification Logs */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Recent Notification Delivery Logs
        </h4>

        {recentLogs.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            No notification logs recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white text-[11px]">
            {recentLogs.map((log) => (
              <div key={log.id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${
                      log.status === "SENT"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : log.status === "SKIPPED"
                        ? "bg-slate-100 text-slate-500"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {log.status}
                  </span>
                  <span className="text-slate-600 font-mono">
                    {log.error_message || "Alert dispatched to Owner"}
                  </span>
                </div>
                <span className="text-slate-400 font-mono text-[10px]">{formatTimeIST(log.sent_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
