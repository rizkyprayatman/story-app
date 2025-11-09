const DB_NAME = "story_app_db";
const DB_VERSION = 3;
const STORE_BOOKMARKS = "favorites";
const STORE_USER_BOOKMARKS = "favorites_by_user";
const STORE_STORIES = "stories";
const STORE_OUTBOX = "outbox";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (ev) => {
      const db = ev.target.result;
      if (!db.objectStoreNames.contains(STORE_BOOKMARKS)) {
        const store = db.createObjectStore(STORE_BOOKMARKS, { keyPath: "id" });
        store.createIndex("by-createdAt", "createdAt");
      }

      if (!db.objectStoreNames.contains(STORE_USER_BOOKMARKS)) {
        const store2 = db.createObjectStore(STORE_USER_BOOKMARKS, {
          keyPath: ["userId", "id"],
        });
        store2.createIndex("by-user", "userId");
      }

      if (!db.objectStoreNames.contains(STORE_STORIES)) {
        const s = db.createObjectStore(STORE_STORIES, { keyPath: "id" });
        s.createIndex("by-createdAt", "createdAt");
      }
        if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
          const o = db.createObjectStore(STORE_OUTBOX, { keyPath: "id", autoIncrement: true });
          o.createIndex("by-createdAt", "createdAt");
        }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addFavorite(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BOOKMARKS, "readwrite");
    const store = tx.objectStore(STORE_BOOKMARKS);
    const req = store.put(item);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function removeFavorite(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BOOKMARKS, "readwrite");
    const store = tx.objectStore(STORE_BOOKMARKS);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function getFavorite(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BOOKMARKS, "readonly");
    const store = tx.objectStore(STORE_BOOKMARKS);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllFavorites() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BOOKMARKS, "readonly");
    const store = tx.objectStore(STORE_BOOKMARKS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function addUserFavorite(userId, item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_USER_BOOKMARKS, "readwrite");
    const store = tx.objectStore(STORE_USER_BOOKMARKS);
    const toPut = { ...item, userId };
    if (!toPut.id) return reject(new Error("item.id is required"));
    const req = store.put(toPut);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function removeUserFavorite(userId, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_USER_BOOKMARKS, "readwrite");
    const store = tx.objectStore(STORE_USER_BOOKMARKS);
    const req = store.delete([userId, id]);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function getUserFavorite(userId, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_USER_BOOKMARKS, "readonly");
    const store = tx.objectStore(STORE_USER_BOOKMARKS);
    const req = store.get([userId, id]);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllUserFavorites(userId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_USER_BOOKMARKS, "readonly");
    const store = tx.objectStore(STORE_USER_BOOKMARKS);
    const index = store.index("by-user");
    const req = index.getAll(IDBKeyRange.only(userId));
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function addOrUpdateStories(items = []) {
  if (!Array.isArray(items) || !items.length) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_STORIES, "readwrite");
    const store = tx.objectStore(STORE_STORIES);
    let count = 0;
    items.forEach((it) => {
      if (!it.id) return;
      const req = store.put(it);
      req.onsuccess = () => {
        count += 1;
        if (count === items.length) resolve(count);
      };
      req.onerror = () => reject(req.error);
    });
    if (items.length === 0) resolve(0);
  });
}

export async function addOrUpdateStory(item) {
  if (!item || !item.id) return null;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_STORIES, "readwrite");
    const store = tx.objectStore(STORE_STORIES);
    const req = store.put(item);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addToOutbox(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_OUTBOX, "readwrite");
    const store = tx.objectStore(STORE_OUTBOX);
    const req = store.add(item);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllOutbox() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_OUTBOX, "readonly");
    const store = tx.objectStore(STORE_OUTBOX);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removeOutbox(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_OUTBOX, "readwrite");
    const store = tx.objectStore(STORE_OUTBOX);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function getStoryFromDB(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_STORIES, "readonly");
    const store = tx.objectStore(STORE_STORIES);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllStoriesFromDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_STORIES, "readonly");
    const store = tx.objectStore(STORE_STORIES);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removeStoryFromDB(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_STORIES, "readwrite");
    const store = tx.objectStore(STORE_STORIES);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export default {
  addFavorite,
  removeFavorite,
  getFavorite,
  getAllFavorites,
  addUserFavorite,
  removeUserFavorite,
  getUserFavorite,
  getAllUserFavorites,
  addOrUpdateStories,
  addOrUpdateStory,
  getStoryFromDB,
  getAllStoriesFromDB,
};
