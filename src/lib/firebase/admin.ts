import * as admin from "firebase-admin";
import { getSupabaseAdminClient } from "../supabase/admin";
import { formatINR } from "../utils/currency";
import { formatTimeIST } from "../utils/timezone";

/**
 * Initialize Firebase Admin singleton safely
 */
function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  // Handle escaped newlines in private key if stored in env var
  if (privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    return null;
  }
}

export interface SaleNotificationPayload {
  saleId: string;
  transactionNumber: string;
  amount: number;
  paymentMethod: "CASH" | "UPI";
  staffName: string;
  createdAt: string;
}

/**
 * Dispatches web push notifications to all active registered Owner devices.
 * Uses idempotency checking against `notification_logs` to prevent duplicates.
 */
export async function sendSalePushNotificationToOwners(payload: SaleNotificationPayload) {
  const supabase = getSupabaseAdminClient();
  const firebaseAdmin = getFirebaseAdmin();

  if (!firebaseAdmin) {
    console.log("Firebase Admin not initialized. Skipping push notification dispatch.");
    return { success: false, reason: "firebase_not_configured" };
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

  // 2. Fetch all active Owner device tokens
  const { data: devices, error: deviceError } = await supabase
    .from("notification_devices")
    .select("id, owner_id, device_token, is_active")
    .eq("is_active", true);

  if (deviceError || !devices || devices.length === 0) {
    console.log("No active Owner devices registered for push notifications.");
    
    // Log as SKIPPED
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

  const title = "VR STREET KARAMA";
  const body = `New Sale Recorded!\nAmount: ${formattedAmount}\nPayment Method: ${paymentLabel}\nStaff: ${payload.staffName}\nTime: ${formattedTime}`;

  const messagePayload: admin.messaging.MulticastMessage = {
    tokens: devices.map((d) => d.device_token),
    notification: {
      title,
      body,
    },
    data: {
      saleId: payload.saleId,
      transactionNumber: payload.transactionNumber,
      amount: payload.amount.toString(),
      paymentMethod: payload.paymentMethod,
      staffName: payload.staffName,
      createdAt: payload.createdAt,
      click_action: "/dashboard/owner",
    },
    webpush: {
      fcmOptions: {
        link: "/dashboard/owner",
      },
      notification: {
        title,
        body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        vibrate: [200, 100, 200],
        requireInteraction: true,
      },
    },
  };

  try {
    const messaging = admin.messaging(firebaseAdmin);
    const response = await messaging.sendEachForMulticast(messagePayload);

    const tokensToDeactivate: string[] = [];

    // Process individual results
    for (let i = 0; i < response.responses.length; i++) {
      const res = response.responses[i];
      const device = devices[i];

      if (res.success) {
        await supabase.from("notification_logs").insert({
          sale_id: payload.saleId,
          owner_id: device.owner_id,
          status: "SENT",
        });
      } else {
        const errCode = res.error?.code;
        console.error(`Failed to send to token ${device.device_token}:`, errCode);

        await supabase.from("notification_logs").insert({
          sale_id: payload.saleId,
          owner_id: device.owner_id,
          status: "FAILED",
          error_message: res.error?.message || errCode,
        });

        // Clean up invalid or expired tokens
        if (
          errCode === "messaging/invalid-registration-token" ||
          errCode === "messaging/registration-token-not-registered"
        ) {
          tokensToDeactivate.push(device.device_token);
        }
      }
    }

    if (tokensToDeactivate.length > 0) {
      console.log(`Deactivating ${tokensToDeactivate.length} invalid device tokens...`);
      await supabase
        .from("notification_devices")
        .update({ is_active: false })
        .in("device_token", tokensToDeactivate);
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error: any) {
    console.error("Error dispatching multicast push notifications:", error);

    await supabase.from("notification_logs").insert({
      sale_id: payload.saleId,
      owner_id: null,
      status: "FAILED",
      error_message: error?.message || "Unknown multicast error",
    });

    return { success: false, error: error?.message };
  }
}

