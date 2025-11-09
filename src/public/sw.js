const CACHE_NAME = "story-app-shell-v1";
const DATA_CACHE = "story-app-data-v1";

try {
  self.importScripts(
    "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"
  );
  if (self.workbox && self.workbox.precaching) {
    self.workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
  } else {
    console.warn("Workbox failed to load; precache disabled.");
  }
} catch (e) {
  console.warn("Failed loading Workbox via importScripts", e);
}

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
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME && k !== DATA_CACHE) return caches.delete(k);
          return Promise.resolve();
        })
      );
      await self.clients.claim();
    })()
  );
});

if (self.workbox && self.workbox.routing && self.workbox.strategies) {
  try {
    const { registerRoute } = self.workbox.routing;
    const { NetworkFirst, CacheFirst } = self.workbox.strategies;
    const { ExpirationPlugin } = self.workbox.expiration || {};

    registerRoute(
      ({ url, request }) =>
        (url.pathname.startsWith("/v1") || url.pathname.startsWith("/api") || (request.headers && request.headers.get && request.headers.get("accept")?.includes("application/json"))),
      new NetworkFirst({
        cacheName: DATA_CACHE,
        networkTimeoutSeconds: 5,
        plugins: [],
      })
    );

    registerRoute(
      ({ request }) => request.destination === "image",
      new CacheFirst({
        cacheName: "story-images-cache",
        plugins: [
          new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
        ],
      })
    );

    registerRoute(
      ({ request }) => request.mode === "navigate",
      async ({ event }) => {
        try {
          return await self.workbox.strategies.NetworkFirst.handle({ event });
        } catch (e) {
          return caches.match("/index.html");
        }
      }
    );
  } catch (e) {
    console.warn("Workbox runtime routes setup failed", e);
  }
} else {
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
                caches.open(DATA_CACHE).then((cache) => cache.put(request, clone));
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
}

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

  if (!options.data) options.data = data.data || data || {};

  if (data.actions && Array.isArray(data.actions)) options.actions = data.actions;

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      const data = event.notification && event.notification.data ? event.notification.data : {};
      const action = event.action;

      const openUrl = (data && data.storyId) ? `/#/stories/${data.storyId}` : (data && data.url) ? data.url : '/';

      if (action) {
        const urlToOpen = openUrl;
        if (clientList.length > 0) {
          const client = clientList[0];
          client.focus();
          client.navigate(urlToOpen).catch(() => {
            console.error("Failed to navigate client to", urlToOpen);
          });
          return;
        }
        return clients.openWindow(urlToOpen);
      }

      if (clientList.length > 0) {
        const client = clientList[0];
        client.focus();
        client.navigate(openUrl).catch(() => {
            console.error("Failed to navigate client to", openUrl);
        });
        return;
      }
      return clients.openWindow(openUrl);
    })
  );
});
