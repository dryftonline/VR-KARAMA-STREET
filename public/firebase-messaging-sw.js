// Scripts for firebase messaging
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

// Initialize Firebase in Service Worker
// Fetch query params or hardcoded default fallback
const urlParams = new URL(location).searchParams;

const firebaseConfig = {
  apiKey: urlParams.get("apiKey") || "",
  authDomain: urlParams.get("authDomain") || "",
  projectId: urlParams.get("projectId") || "",
  storageBucket: urlParams.get("storageBucket") || "",
  messagingSenderId: urlParams.get("messagingSenderId") || "",
  appId: urlParams.get("appId") || "",
};

// Check if credentials are provided via params or default
if (firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log("[firebase-messaging-sw.js] Received background message:", payload);

    const notificationTitle = payload.notification?.title || "VR STREET KARAMA";
    const notificationOptions = {
      body: payload.notification?.body || "New Sale Recorded!",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      vibrate: [200, 100, 200],
      tag: "vr-sale-" + (payload.data?.saleId || Date.now()),
      data: payload.data || {},
      requireInteraction: true,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Notification Click Event: Focus or Open Owner Dashboard
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = "/dashboard/owner";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes("/dashboard/owner") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

