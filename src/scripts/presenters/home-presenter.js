import { getStories } from "../data/api";
import { showLoading, hideLoading } from "../utils/loading";
import db from "../utils/indexeddb";
import {
  MAP_TILE_URL,
  MAP_TILE_ATTR,
  MAP_TILE_OPTIONS,
  MAP_TOPO_URL,
  MAP_TOPO_ATTR,
} from "../config";

export default class HomePresenter {
  constructor({ viewContainer }) {
    this._viewContainer = viewContainer;
  }

  async init() {
    // fetch stories (include token if present)
    showLoading("Loading stories...");
    let resp = null;
    try {
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("token")
          : null;
      if (token) {
        // user logged in - fetch from API
        resp = await getStories(token, { page: 1, size: 20, location: 0 });
      } else {
        // guest - do not hit network; try to load cached stories from IndexedDB
        try {
          const stored = await db.getAllStoriesFromDB();
          if (Array.isArray(stored) && stored.length) {
            resp = { listStory: stored };
          } else {
            resp = { listStory: [] };
          }
        } catch (e) {
          resp = { listStory: [] };
        }
      }
    } catch (err) {
      console.error("getStories error", err);
      if (window.Swal)
        window.Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load stories.",
        });
    } finally {
      hideLoading();
    }
    let stories = [];
    if (resp) {
      stories = resp.listStory || resp.stories || resp.story || resp.data || [];
      if (!Array.isArray(stories)) stories = [];
    }

    this._renderList(stories);
    this._initMap(stories);
  }

  _renderList(stories) {
    const listEl = document.getElementById("stories-list");
    if (!listEl) return;
    listEl.innerHTML = "";
    stories.forEach((s) => {
      const card = document.createElement("div");
      card.className = "story-card";
      const photo = s.photoUrl || "";
      const created = s.createdAt ? new Date(s.createdAt).toLocaleString() : "";
      const name = s.name || (s.owner && s.owner.name) || "name user";
      const desc = (s.description || "").slice(0, 300);

      card.innerHTML = `
        <div class="story-image"><img src="${photo}" alt="story image" /></div>
        <div class="story-body">
          <div class="story-meta">
            <div class="story-author">${name}</div>
            <div class="story-date">${created}</div>
          </div>
          <p class="story-desc">${desc}</p>
          <div class="story-actions">
            <button class="details-btn btn">Details</button>
            <button class="fav-btn" title="Save to favorites" aria-label="Save to favorites"><i data-feather="star"></i></button>
          </div>
        </div>
      `;

      const detailsBtn = card.querySelector(".details-btn");
      detailsBtn.addEventListener("click", () => {
        location.hash = `#/stories/${s.id}`;
      });

      const favBtn = card.querySelector(".fav-btn");

      (async () => {
        try {
          const userId = globalThis.localStorage.getItem("userId") || null;
          if (!userId) return;
          const existing = await db.getUserFavorite(userId, s.id);
          if (existing) favBtn.classList.add("active");
          try {
            globalThis.feather?.replace();
          } catch (e) {}
        } catch (e) {
          console.error("favorite check error", e);
        }
      })();

      favBtn.addEventListener("click", async () => {
        try {
          const userId = globalThis.localStorage.getItem("userId") || null;
          if (!userId) {
            if (globalThis.Swal)
              globalThis.Swal.fire(
                "Login required",
                "Please login to save favorites.",
                "info"
              );
            else alert("Please login to save favorites.");
            return;
          }
          const existing = await db.getUserFavorite(userId, s.id);
          if (existing) {
            await db.removeUserFavorite(userId, s.id);
            favBtn.classList.remove("active");
          } else {
            const toSave = {
              id: s.id,
              name,
              photo: photo,
              description: s.description,
              createdAt: s.createdAt,
            };
            await db.addUserFavorite(userId, toSave);
            favBtn.classList.add("active");
          }
        } catch (err) {
          console.error("favorite error", err);
        }
      });

      listEl.appendChild(card);
    });

    try {
      if (typeof globalThis !== "undefined") globalThis.feather?.replace();
    } catch (e) {
      console.error("Feather icons replacement error", e);
    }
  }

  _initMap(stories) {
    const mapEl = document.getElementById("home-map");
    if (!mapEl || !window.L) return;

    const map = L.map(mapEl).setView([0, 0], 2);
    const osm = L.tileLayer(
      MAP_TILE_URL,
      Object.assign({ attribution: MAP_TILE_ATTR }, MAP_TILE_OPTIONS)
    );
    const topo = L.tileLayer(
      MAP_TOPO_URL,
      Object.assign({ attribution: MAP_TOPO_ATTR }, { maxZoom: 17 })
    );
    osm.addTo(map);
    L.control.layers({ OpenStreetMap: osm, Topo: topo }).addTo(map);

    const group = L.featureGroup().addTo(map);
    stories.forEach((s) => {
      const lat = s.lat || (s.location && s.location.lat) || null;
      const lon = s.lon || (s.location && s.location.lon) || null;
      if (lat && lon) {
        const marker = L.marker([Number(lat), Number(lon)]).addTo(group);
        marker.bindPopup(
          `<strong>${s.name || "Story"}</strong><br/>${(
            s.description || ""
          ).slice(0, 120)}`
        );
      }
    });

    if (group.getLayers().length)
      map.fitBounds(group.getBounds(), { maxZoom: 13 });
  }
}
