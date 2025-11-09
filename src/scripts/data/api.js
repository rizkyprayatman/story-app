import CONFIG from "../config";

const ENDPOINTS = {
  STORIES: `${CONFIG.BASE_URL}/stories`,
  STORY: (id) => `${CONFIG.BASE_URL}/stories/${id}`,
  NOTIFICATIONS_SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`,
};

export async function getStories(token = null, params = {}) {
  const query = [];
  if (params.page != null)
    query.push(`page=${encodeURIComponent(params.page)}`);
  if (params.size != null)
    query.push(`size=${encodeURIComponent(params.size)}`);
  if (params.location != null)
    query.push(`location=${encodeURIComponent(params.location)}`);
  const url = query.length
    ? `${ENDPOINTS.STORIES}?${query.join("&")}`
    : ENDPOINTS.STORIES;

  const authToken =
    token ||
    (typeof window !== "undefined"
      ? window.localStorage.getItem("token")
      : null);
  const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

  try {
    const response = await fetch(url, { headers });
    const data = await response.json();
    try {
      const idb = await import("../utils/indexeddb");
      const stories =
        data.listStory ||
        data.stories ||
        data.story ||
        (data.data && data.data.listStory) ||
        [];
      if (Array.isArray(stories) && stories.length) {
        await idb.addOrUpdateStories(
          stories.map((it) => ({
            id: it.id,
            name: it.name || it.owner?.name || "",
            description: it.description,
            photoUrl: it.photoUrl || it.photo,
            createdAt: it.createdAt || it.created_at || Date.now(),
            lat: it.lat || (it.location && it.location.lat),
            lon: it.lon || (it.location && it.location.lon),
          }))
        );
      }
    } catch (e) {
      console.error("IndexedDB error", e);
    }
    return data;
  } catch (err) {
    try {
      if (typeof globalThis !== "undefined" && globalThis && globalThis.Swal) {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          globalThis.Swal.fire(
            "Offline",
            "You are offline. Showing cached content where available.",
            "info"
          );
        } else {
          globalThis.Swal.fire(
            "Network error",
            "Failed to load stories from the server.",
            "error"
          );
        }
      }
    } catch (e) {
      console.error("Error showing notification", e);
    }

    if (typeof caches !== "undefined") {
      try {
        const cached = await caches.match(url);
        if (cached) return cached.json ? await cached.json() : null;
      } catch (e) {
        console.error("Cache error", e);
      }
    }

    try {
      const idb = await import("../utils/indexeddb");
      const stored = await idb.getAllStoriesFromDB();
      if (Array.isArray(stored) && stored.length) {
        return { listStory: stored };
      }
    } catch (e) {
      console.error("IndexedDB error", e);
    }

    return { error: true, message: err.message || "Network error" };
  }
}

export async function getStory(id, token = null) {
  const url = ENDPOINTS.STORY(id);
  const authToken =
    token ||
    (typeof window !== "undefined"
      ? window.localStorage.getItem("token")
      : null);
  const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  try {
    const response = await fetch(url, { headers });
    const data = await response.json();
    // persist single story for offline
    try {
      const idb = await import("../utils/indexeddb");
      const story = data.story || data.data || data;
      if (story && (story.id || story._id)) {
        await idb.addOrUpdateStory({
          id: story.id || story._id,
          name: story.name || story.owner?.name || "",
          description: story.description,
          photoUrl: story.photoUrl || story.photo,
          createdAt: story.createdAt || story.created_at || Date.now(),
          lat: story.lat,
          lon: story.lon,
        });
      }
    } catch (e) {
      console.error("IndexedDB error", e);
    }
    return data;
  } catch (err) {
    try {
      if (typeof globalThis !== "undefined" && globalThis && globalThis.Swal) {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          globalThis.Swal.fire(
            "Offline",
            "You are offline. Showing cached story where available.",
            "info"
          );
        } else {
          globalThis.Swal.fire(
            "Network error",
            "Failed to load story from the server.",
            "error"
          );
        }
      }
    } catch (e) {}

    if (typeof caches !== "undefined") {
      try {
        const cached = await caches.match(url);
        if (cached) return cached.json ? await cached.json() : null;
      } catch (e) {
        console.error("Cache error", e);
      }
    }

    try {
      const idb = await import("../utils/indexeddb");
      const stored = await idb.getStoryFromDB(id);
      if (stored) return { story: stored };
    } catch (e) {
      console.error("IndexedDB error", e);
    }

    return { error: true, message: err.message || "Network error" };
  }
}

export async function postStory(formData, token = null) {
  const authToken =
    token ||
    (typeof window !== "undefined"
      ? window.localStorage.getItem("token")
      : null);

  try {
    const photo = formData.get("photo");
    if (photo && photo.size && photo.size > 1024 * 1024) {
      return { error: true, message: "Photo must be less than 1MB" };
    }
    if (photo && photo.type && !photo.type.startsWith("image/")) {
      return { error: true, message: "Photo must be a valid image file" };
    }
  } catch (e) {
    console.error("Photo validation error", e);
  }

  const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  const endpoint = authToken
    ? ENDPOINTS.STORIES
    : `${CONFIG.BASE_URL}/stories/guest`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: formData,
    });

    return response.json();
  } catch (err) {
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        try {
          const idb = await import("../utils/indexeddb");
          const obj = {};
          formData.forEach((v, k) => {
            if (v instanceof File) {
              obj[k] = { name: v.name, type: v.type, size: v.size };
            } else obj[k] = v;
          });
          obj.createdAt = Date.now();
          await idb.addToOutbox(obj);
          if (typeof globalThis !== "undefined" && globalThis.Swal)
            globalThis.Swal.fire("Queued", "Story saved offline and will be synced when online.", "info");
          return { queued: true, message: "Saved offline" };
        } catch (e) {
          console.error("Failed to queue post", e);
        }
      } else {
        if (typeof globalThis !== "undefined" && globalThis && globalThis.Swal) {
          globalThis.Swal.fire("Network error", "Failed to post story to the server.", "error");
        }
      }
    } catch (e) {
      console.error("postStory error handler", e);
    }
    return { error: true, message: err.message || "Network error" };
  }
}

export async function subscribeNotification(subscription, token = null) {
  const authToken =
    token ||
    (typeof window !== "undefined"
      ? window.localStorage.getItem("token")
      : null);
  const headers = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const resp = await fetch(ENDPOINTS.NOTIFICATIONS_SUBSCRIBE, {
    method: "POST",
    headers,
    body: JSON.stringify(subscription),
  });
  return resp.json();
}

export async function unsubscribeNotification(endpoint, token = null) {
  const authToken =
    token ||
    (typeof window !== "undefined"
      ? window.localStorage.getItem("token")
      : null);
  const headers = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const resp = await fetch(ENDPOINTS.NOTIFICATIONS_SUBSCRIBE, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ endpoint }),
  });
  return resp.json();
}

export async function registerUser({ name, email, password }) {
  try {
    const resp = await fetch(`${CONFIG.BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      return {
        error: true,
        status: resp.status,
        message:
          (data && (data.message || data.error)) ||
          `Request failed (${resp.status})`,
        body: data,
      };
    }
    return data;
  } catch (err) {
    return { error: true, message: err.message || "Network error" };
  }
}

export async function loginUser({ email, password }) {
  try {
    const resp = await fetch(`${CONFIG.BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      return {
        error: true,
        status: resp.status,
        message:
          (data && (data.message || data.error)) ||
          `Request failed (${resp.status})`,
        body: data,
      };
    }
    return data;
  } catch (err) {
    return { error: true, message: err.message || "Network error" };
  }
}
