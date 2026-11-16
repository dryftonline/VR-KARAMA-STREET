"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  BellOff,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  Volume2,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatTimeIST } from "@/lib/utils/timezone";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// Utility: convert base64 URL-safe string to Uint8Array for PushManager
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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

function formatDeviceLabel(token: string) {
  try {
    if (token.startsWith("{")) {
      const parsed = JSON.parse(token);
      if (parsed.endpoint) {
        const url = new URL(parsed.endpoint);
        return `${url.hostname} (${parsed.endpoint.slice(-8)})`;
      }
    }
  } catch (e) {}
  return `...${token.slice(-14)}`;
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

    // Supabase Realtime Listener for instant in-tab updates
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("owner-device-push-alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sales" },
        (payload: any) => {
          const sale = payload.new;
          playNotificationChime();
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
        toastError("Browser notifications are not supported on this browser.", "Not Supported");
        return;
      }

      if (!("serviceWorker" in navigator)) {
        toastError("Service Workers are not supported on this device.", "Not Supported");
        return;
      }

      // 1. Request notification permission from user
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission !== "granted") {
        toastError(
          "Notification permission was denied. Please allow notifications in your browser address bar settings.",
          "Permission Denied"
        );
        return;
      }

      // 2. Ensure Service Worker is registered and active
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register("/sw.js");
      }
      await navigator.serviceWorker.ready;

      // 3. Obtain standard W3C PushSubscription with VAPID public key
      const vapidPublicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        "BCB3bo_wte0Nw4oI63KhrEjfoqTOYhQtvkEz7cJNJNOFSNCuhU9HykrNO48k6oONnfYCTM3aOnjMFuun59YQNd0";

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      const subscriptionJson = JSON.stringify(subscription.toJSON());

      // 4. Determine device type & user-friendly name
      const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
      const deviceType = isMobile ? "mobile" : "desktop";

      const browserName = navigator.userAgent.includes("Chrome")
        ? "Chrome"
        : navigator.userAgent.includes("Firefox")
        ? "Firefox"
        : navigator.userAgent.includes("Safari")
        ? "Safari"
        : navigator.userAgent.includes("Edge")
        ? "Edge"
        : "Browser";

      const osName = /Windows/i.test(navigator.userAgent)
        ? "Windows"
        : /Android/i.test(navigator.userAgent)
        ? "Android"
        : /iPhone|iPad/i.test(navigator.userAgent)
        ? "iOS"
        : /Mac/i.test(navigator.userAgent)
        ? "macOS"
        : "Device";

      const deviceName = `Owner ${browserName} (${osName})`;

      // 5. Send PushSubscription to API to persist in database
      const res = await fetch("/api/notifications/register-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: subscriptionJson,
          deviceToken: subscriptionJson,
          deviceType,
          deviceName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register push device with server");
      }

      // 6. Play audio chime and display confirmation notification
      playNotificationChime();
      await registration.showNotification("VR Street Karama • Background Push Ready! 🔔", {
        body: "Background push alerts are now active. You will receive notifications even when the app is closed!",
        icon: "/logo.png",
        badge: "/logo.png",
      });

      toastSuccess(
        "Device registered successfully! Background alerts will arrive even when closed.",
        "Push Alerts Active"
      );
      fetchDevicesAndLogs();
    } catch (err: any) {
      console.error("Enable push notifications error:", err);
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
      playNotificationChime();

      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([100, 50, 100]);
      }

      const res = await fetch("/api/notifications/test", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to dispatch test notification");

      toastSuccess(
        data.message || "Test push notification dispatched to your registered devices!",
        "Test Dispatched"
      );
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
            Push Notifications &amp; Background Alerts
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant OS-level alerts dispatched to your device whenever a sale is committed to the shared sales ledger — even when the app is closed.
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
            <span className="text-xs font-bold text-slate-900">Current Device Status:</span>
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
                <AlertTriangle className="w-3 h-3" /> Not Configured Yet
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Standard W3C Web Push with Service Worker. Works on Android Chrome, Windows, Mac, and iOS PWA even when the browser or tab is completely closed.
          </p>
        </div>

        <button
          onClick={handleEnableNotifications}
          disabled={isRegistering}
          className="px-5 py-2.5 rounded-full bg-[#5850EC] hover:bg-[#4F46E5] text-white text-xs font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-all shrink-0 flex items-center gap-2"
        >
          <Bell className="w-4 h-4" />
          <span>
            {isRegistering
              ? "Registering..."
              : devices.length > 0
              ? "Re-sync Push Token"
              : "Enable Background Alerts"}
          </span>
        </button>
      </div>

      {/* Background Reliability Note */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-[#5850EC] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">Background Delivery:</span>
          {" "}Push alerts are encrypted with your server VAPID key and delivered directly via the operating system push service. They will wake up your device and sound the notification even if your screen is locked or browser is closed.
        </div>
      </div>

      {/* Registered Devices List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Registered Owner Devices ({devices.length})
        </h4>

        {devices.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-200/80">
            No devices registered yet. Click &quot;Enable Background Alerts&quot; above to connect this device.
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
                      Push Service: {formatDeviceLabel(dev.device_token)}
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
