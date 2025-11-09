const CONFIG = {
  BASE_URL:
    (typeof process !== "undefined" && process.env?.BASE_API_URL) ||
    globalThis?.BASE_API_URL ||
    "https://story-api.dicoding.dev/v1",
};

export default CONFIG;

const _envKey =
  (typeof process !== "undefined" && process.env?.MAP_SERVICE_API_KEY) ||
  globalThis?.MAP_SERVICE_API_KEY;
export const MAP_KEY = _envKey ?? "C0EXQO18WWtb8p7zZArs";

export const MAP_TILE_URL = MAP_KEY
  ? `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAP_KEY}`
  : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const MAP_TILE_ATTR = MAP_KEY
  ? "&copy; MapTiler & OpenStreetMap contributors"
  : "&copy; OpenStreetMap contributors";
export const MAP_TILE_OPTIONS = { maxZoom: 19 };

export const MAP_TOPO_URL = MAP_KEY
  ? `https://api.maptiler.com/maps/topo/{z}/{x}/{y}.png?key=${MAP_KEY}`
  : "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
export const MAP_TOPO_ATTR = MAP_KEY
  ? "&copy; MapTiler & OpenStreetMap contributors"
  : "&copy; OpenTopoMap contributors";
