import { subscribeNotification, unsubscribeNotification } from "../data/api";

const _vapid =
  (typeof process !== "undefined" && process.env?.MAP_VAPID_PUBLIC_KEY) ||
  globalThis?.MAP_VAPID_PUBLIC_KEY;
const VAPID_PUBLIC_KEY =
  _vapid ??
  "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    // Attempt to fetch the SW script first. In dev the copied `sw.js` may
    // contain top-level ES `import`/`export` which will throw when evaluated
    // by the browser ("Cannot use import statement outside a module").
    // We avoid registering such unbundled scripts.
    try {
      const resp = await fetch("./sw.js", { cache: "no-store" });
      if (!resp.ok) return null;
      const txt = await resp.clone().text();
      if (/^\s*(import|export)\s+/m.test(txt)) {
        console.warn(
          "Not registering service worker: sw.js appears to contain ES module syntax."
        );
        return null;
      }
    } catch (e) {
      // if fetch fails, bail out gracefully
      console.warn("Could not fetch sw.js before registration", e);
      return null;
    }

    const reg = await navigator.serviceWorker.register("./sw.js");
    return reg;
  } catch (err) {
    console.error("SW register failed", err);
    return null;
  }
}

export async function isSubscribed() {
  if (!("serviceWorker" in navigator)) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

export async function subscribeUser() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push not supported");
  }

  const reg = await registerServiceWorker();
  if (!reg) throw new Error("Service worker not registered");

  const permission = await Notification.requestPermission();
  if (permission !== "granted")
    throw new Error("Notification permission denied");

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // prepare payload for backend
  const json = sub.toJSON();
  const keys = json && json.keys ? json.keys : {};
  const payload = {
    endpoint: sub.endpoint,
    // backend expects keys object containing p256dh and auth
    keys: {
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  };

  const resp = await subscribeNotification(payload);
  return { subscription: sub, resp };
}

export async function unsubscribeUser() {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) throw new Error("No service worker registration");
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return { unsubscribed: false };

  const endpoint = sub.endpoint;
  const resp = await unsubscribeNotification(endpoint);
  try {
    await sub.unsubscribe();
  } catch (err) {
    console.warn("Failed to unsubscribe from push manager", err);
  }
  return { unsubscribed: true, resp };
}

export async function showLocalNotification(title, options = {}) {
  // show using service worker registration if available
  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg && reg.showNotification) {
      reg.showNotification(title, options);
      return;
    }
  }
  // fallback to Notification API
  if (Notification && Notification.permission === "granted") {
    new Notification(title, options);
  }
}

export default {
  registerServiceWorker,
  isSubscribed,
  subscribeUser,
  unsubscribeUser,
  showLocalNotification,
};
