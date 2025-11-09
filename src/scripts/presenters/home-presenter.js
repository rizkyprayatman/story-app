import { getStories } from "../data/api";
import { showLoading, hideLoading } from "../utils/loading";
import db from "../utils/indexeddb";
import * as session from "../models/session";
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

  async toggleFavorite(storyId) {
    try {
      const userId = session.getUserId();
      if (!userId) {
        if (globalThis.Swal) globalThis.Swal.fire('Login required', 'Please login to save favorites.', 'info');
        else alert('Please login to save favorites.');
        return 'noop';
      }

      const existing = await db.getUserFavorite(userId, storyId);
      if (existing) {
        await db.removeUserFavorite(userId, storyId);
        return 'removed';
      }

      let story = null;
      try {
        const all = await db.getAllStoriesFromDB();
        story = (all || []).find((x) => String(x.id) === String(storyId)) || null;
      } catch (e) {
        story = null;
      }

      const toSave = story
        ? { id: story.id, name: story.name, photo: story.photoUrl || story.photo, description: story.description, createdAt: story.createdAt }
        : { id: storyId };

      await db.addUserFavorite(userId, toSave);
      return 'added';
    } catch (e) {
      console.error('toggleFavorite error', e);
      return 'error';
    }
  }

  initMap(stories) {
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
          `<strong>${s.name || 'Story'}</strong><br/>${(s.description || '').slice(0, 120)}`
        );
      }
    });

    if (group.getLayers().length) map.fitBounds(group.getBounds(), { maxZoom: 13 });
  }

  async init() {
    showLoading("Loading stories...");
    let resp = null;
    try {
      const token = session.getToken();
      if (token) {
        resp = await getStories(token, { page: 1, size: 20, location: 0 });
      } else {
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
    try {
      if (this._viewContainer && typeof this._viewContainer.renderList === "function") {
        this._viewContainer.renderList(stories);
      }
      if (this._viewContainer && typeof this._viewContainer.initMap === "function") {
        this._viewContainer.initMap(stories);
      }
    } catch (e) {
      console.error("Error delegating render/initMap to view", e);
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
