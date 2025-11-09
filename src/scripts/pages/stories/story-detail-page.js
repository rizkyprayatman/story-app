import { parseActivePathname } from "../../routes/url-parser";
import { getStory } from "../../data/api";
import { showLoading, hideLoading } from "../../utils/loading";
import { MAP_TILE_URL, MAP_TILE_ATTR, MAP_TILE_OPTIONS } from "../../config";

export default class StoryDetailPage {
  async render() {
    return `
      <section class="container story-detail">
        <h1 class="page-title">Story Detail</h1>
        <button id="back-btn" class="btn back-btn">Back</button>
        <div id="detail-content">Loading...</div>
      </section>
    `;
  }

  async afterRender() {
    const path = parseActivePathname();
    const id = path.id;
    const container = document.getElementById("detail-content");
    if (!id) {
      container.innerHTML = "<p>Story id not provided.</p>";
      return;
    }

    showLoading("Loading story...");
    try {
      const token = window.localStorage.getItem("token") || null;
      const resp = await getStory(id, token);
      if (resp && !resp.error && resp.story) {
        const s = resp.story;
        const created = s.createdAt ? new Date(s.createdAt).toLocaleString() : "";
        const storyTitle = s.title || "";
        container.innerHTML = `
          <div class="detail-image"><img src="${s.photoUrl}" alt="story image"/></div>
          <div class="detail-header">
            ${storyTitle ? `<h2 class="story-title">${storyTitle}</h2>` : ""}
            <div class="detail-meta">
              <div class="detail-author">${s.name || ""}</div>
              <div class="detail-date">${created}</div>
            </div>
          </div>
          <div class="detail-desc">${s.description}</div>
          <div id="detail-map" class="story-map"></div>
        `;

        if (window.L) {
          const mapEl = document.getElementById("detail-map");
          const map = L.map(mapEl).setView([s.lat || 0, s.lon || 0], 13);
          const osm = L.tileLayer(
            MAP_TILE_URL,
            Object.assign({ attribution: MAP_TILE_ATTR }, MAP_TILE_OPTIONS)
          );
          osm.addTo(map);
          if (s.lat && s.lon)
            L.marker([Number(s.lat), Number(s.lon)]).addTo(map);
        }
      } else {
        container.innerHTML = `<p>${
          (resp && resp.message) || "Failed to fetch story"
        }</p>`;
      }
    } catch (err) {
      console.error("getStory error", err);
      container.innerHTML = `<p>Error loading story.</p>`;
    } finally {
      hideLoading();
    }

    const backBtn = document.getElementById("back-btn");
    backBtn.addEventListener("click", () => {
      location.hash = "#/stories";
    });
  }
}
