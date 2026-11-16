const CACHE_NAME = "vr-street-karama-v2";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/offline",
  "/logo.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Failed to cache some static assets during install:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // NEVER cache API requests, auth callbacks, or Supabase realtime/REST calls
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.origin.includes("supabase") ||
    event.request.method !== "GET"
  ) {
    return; // Pass through to network
  }

  // Network-first strategy with offline page fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (event.request.mode === "navigate") {
          return caches.match("/offline") || Response.error();
        }
        return Response.error();
      })
  );
});

// ============================================================================
// BACKGROUND WEB PUSH EVENT LISTENER (Works even when the app is closed!)
// ============================================================================
self.addEventListener("push", (event) => {
  let payload = {
    title: "VR STREET KARAMA",
    body: "New sale recorded to the shared ledger.",
    icon: "/logo.png",
    badge: "/logo.png",
    url: "/dashboard/owner",
  };

  if (event.data) {
    try {
      const data = event.data.json();
      payload = { ...payload, ...data };
    } catch (e) {
      payload.body = event.data.text() || payload.body;
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: payload.icon || "/logo.png",
    badge: payload.badge || "/logo.png",
    data: {
      url: payload.url || "/dashboard/owner",
      dateOfArrival: Date.now(),
    },
    vibrate: [200, 100, 200, 100, 200],
    tag: payload.tag || `sale-alert-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

// ============================================================================
// NOTIFICATION CLICK EVENT (Focuses or opens the Owner dashboard)
// ============================================================================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/dashboard/owner";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open with the dashboard, focus it
      for (const client of clientList) {
        if (client.url.includes("/dashboard/owner") && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
