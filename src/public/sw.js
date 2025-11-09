const CACHE_NAME = "story-app-shell-v1";
const DATA_CACHE = "story-app-data-v1";

import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST || []);

const APP_SHELL = [
  "index.html",
  "styles/styles.css",
  "images/logo.png",
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        const results = await Promise.allSettled(
          APP_SHELL.map((url) => cache.add(url))
        );
        results.forEach((r, idx) => {
          if (r.status === "rejected") {
            console.warn("SW: failed to cache", APP_SHELL[idx], r.reason);
          }
        });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((k) => {
            if (k !== CACHE_NAME && k !== DATA_CACHE) return caches.delete(k);
            return Promise.resolve();
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (ev) => {
  const { request } = ev;
  const url = new URL(request.url);

  if (url.origin !== location.origin && !url.pathname.startsWith("/v1")) {
    return;
  }

  if (
    request.url.includes("/v1") ||
    request.headers.get("accept")?.includes("application/json")
  ) {
    if (request.method === "GET") {
      ev.respondWith(
        fetch(request)
          .then((resp) => {
            if (resp && resp.status === 200) {
              const clone = resp.clone();
              caches
                .open(DATA_CACHE)
                .then((cache) => cache.put(request, clone));
            }
            return resp;
          })
          .catch(() => caches.match(request))
      );
    } else {
      ev.respondWith(
        fetch(request).catch(
          () =>
            new Response(
              JSON.stringify({ error: true, message: "Network error" }),
              { status: 503, headers: { "Content-Type": "application/json" } }
            )
        )
      );
    }
    return;
  }

  if (request.mode === "navigate") {
    ev.respondWith(fetch(request).catch(() => caches.match("/index.html")));
    return;
  }

  ev.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request)
          .then((resp) => {
            if (resp && resp.status === 200) {
              const copy = resp.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return resp;
          })
          .catch(() => cached)
    )
  );
});

self.addEventListener("push", function (event) {
  let data = {};
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    data = {
      title: "New notification",
      options: {
        body:
          event.data && event.data.text
            ? event.data.text
            : "You have a new message",
      },
    };
  }

  const title = data.title || "Notification";
  const options = data.options || { body: "You have a new notification" };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        if (clientList.length > 0) {
          const client = clientList[0];
          return client.focus();
        }
        return clients.openWindow("/");
      })
  );
});
