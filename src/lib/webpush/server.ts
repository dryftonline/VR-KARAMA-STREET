import { setVapidDetails, sendNotification, type PushSubscription } from "web-push";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/utils/currency";
import { formatTimeIST } from "@/lib/utils/timezone";

// Initialize VAPID details for standard W3C Web Push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:owner@vrstreetkarama.com";

let vapidConfigured = false;
if (vapidPublicKey && vapidPrivateKey) {
  try {
    setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    vapidConfigured = true;
  } catch (err) {
    console.error("Failed to initialize web-push VAPID details:", err);
  }
}

export interface SalePushPayload {
  saleId: string;
  transactionNumber: string;
  amount: number;
  paymentMethod: "CASH" | "UPI";
  staffName: string;
  createdAt: string;
}

/**
 * Dispatches Web Push notifications to all active Owner devices.
 * Delivers directly to the operating system even when the browser is closed!
 */
export async function sendSaleWebPushToOwners(payload: SalePushPayload) {
  const supabase = getSupabaseAdminClient();

  if (!vapidConfigured) {
    console.warn("WebPush VAPID keys not configured. Skipping background push.");
    return { success: false, reason: "vapid_not_configured" };
  }

  // 1. Idempotency Check: Verify if notification has already been sent for this sale
  const { data: existingLog } = await supabase
    .from("notification_logs")
    .select("id, status")
    .eq("sale_id", payload.saleId)
    .eq("status", "SENT")
    .maybeSingle();

  if (existingLog) {
    console.log(`Notification for sale ${payload.saleId} already sent. Skipping.`);
    return { success: true, skipped: true };
  }

  // 2. Fetch all active Owner device subscriptions
  const { data: devices, error: deviceError } = await supabase
    .from("notification_devices")
    .select("id, owner_id, device_token, is_active")
    .eq("is_active", true);

  if (deviceError || !devices || devices.length === 0) {
    console.log("No active Owner devices registered for push notifications.");
    await supabase.from("notification_logs").insert({
      sale_id: payload.saleId,
      owner_id: null,
      status: "SKIPPED",
      error_message: "No active owner devices found",
    });
    return { success: true, count: 0 };
  }

  const paymentLabel = payload.paymentMethod === "UPI" ? "GPay / UPI" : "Cash";
  const formattedAmount = formatINR(payload.amount);
  const formattedTime = formatTimeIST(payload.createdAt);

  const pushPayload = JSON.stringify({
    title: "VR Street Karama • Sale Recorded! 💰",
    body: `${formattedAmount} received via ${paymentLabel} by ${payload.staffName}\nRef #${payload.transactionNumber} at ${formattedTime}`,
    icon: "/logo.png",
    badge: "/logo.png",
    url: "/dashboard/owner",
    tag: `sale-${payload.saleId}`,
    data: {
      url: "/dashboard/owner",
      saleId: payload.saleId,
      transactionNumber: payload.transactionNumber,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
    },
  });

  const inactiveDeviceIds: string[] = [];
  let sentCount = 0;
  let failCount = 0;

  for (const dev of devices) {
    try {
      let subscription: PushSubscription;
      if (dev.device_token.startsWith("{")) {
        subscription = JSON.parse(dev.device_token);
      } else {
        // Not a standard PushSubscription object
        continue;
      }

      await sendNotification(subscription, pushPayload, {
        TTL: 60 * 60 * 24, // 24 hours
        urgency: "high",
      });

      sentCount++;
      await supabase.from("notification_logs").insert({
        sale_id: payload.saleId,
        owner_id: dev.owner_id,
        status: "SENT",
      });
    } catch (err: any) {
      failCount++;
      const statusCode = err?.statusCode;
      console.error(`WebPush dispatch error (device ${dev.id}):`, statusCode, err?.message);

      await supabase.from("notification_logs").insert({
        sale_id: payload.saleId,
        owner_id: dev.owner_id,
        status: "FAILED",
        error_message: err?.message || `HTTP ${statusCode}`,
      });

      // Subscription expired or revoked (410 Gone / 404 Not Found)
      if (statusCode === 410 || statusCode === 404) {
        inactiveDeviceIds.push(dev.id);
      }
    }
  }

  // Deactivate stale subscriptions
  if (inactiveDeviceIds.length > 0) {
    await supabase
      .from("notification_devices")
      .update({ is_active: false })
      .in("id", inactiveDeviceIds);
  }

  return { success: true, sentCount, failCount };
}

/**
 * Dispatches a test Web Push notification to all active Owner devices.
 */
export async function sendTestWebPushToOwners(targetOwnerId?: string) {
  const supabase = getSupabaseAdminClient();

  if (!vapidConfigured) {
    throw new Error("WebPush VAPID keys not configured. Please check environment variables.");
  }

  let query = supabase
    .from("notification_devices")
    .select("id, owner_id, device_token, is_active")
    .eq("is_active", true);

  if (targetOwnerId) {
    query = query.eq("owner_id", targetOwnerId);
  }

  const { data: devices, error: deviceError } = await query;

  if (deviceError || !devices || devices.length === 0) {
    throw new Error("No active registered owner devices found. Please click 'Enable Background Alerts' first.");
  }

  const testPayload = JSON.stringify({
    title: "VR Street Karama • Test Alert 💰",
    body: "₹1,500.00 received via GPay / UPI by Rahul Sharma (Background Test Notification)",
    icon: "/logo.png",
    badge: "/logo.png",
    url: "/dashboard/owner",
    tag: `test-alert-${Date.now()}`,
    data: {
      url: "/dashboard/owner",
      test: true,
    },
  });

  const inactiveDeviceIds: string[] = [];
  let sentCount = 0;
  let failCount = 0;

  for (const dev of devices) {
    try {
      if (!dev.device_token.startsWith("{")) continue;
      const subscription = JSON.parse(dev.device_token);

      await sendNotification(subscription, testPayload, {
        TTL: 60 * 60,
        urgency: "high",
      });

      sentCount++;
    } catch (err: any) {
      failCount++;
      const statusCode = err?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        inactiveDeviceIds.push(dev.id);
      }
    }
  }

  if (inactiveDeviceIds.length > 0) {
    await supabase
      .from("notification_devices")
      .update({ is_active: false })
      .in("id", inactiveDeviceIds);
  }

  return { sentCount, failCount, totalDevices: devices.length };
}
