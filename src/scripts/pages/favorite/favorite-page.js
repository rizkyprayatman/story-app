export default class FavoritePage {
  async render() {
    return `
      <section class="container">
        <h1>Favorite</h1>

        <div class="saved-controls">
          <input id="saved-search" placeholder="Search title or description" />
          <select id="saved-sort">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title-asc">Title A–Z</option>
            <option value="title-desc">Title Z–A</option>
          </select>
          <button id="saved-sync" class="btn">Sync Outbox</button>
        </div>

        <div id="favorite-content"></div>
      </section>
    `;
  }

  async afterRender() {
    const content = document.getElementById("favorite-content");
    this.searchEl = document.getElementById("saved-search");
    this.sortEl = document.getElementById("saved-sort");
    this.syncBtn = document.getElementById("saved-sync");

    const userId = window.localStorage.getItem("userId") || null;

  this.searchEl.addEventListener("input", () => this.applyFilters());
  this.sortEl.addEventListener("change", () => this.applyFilters());
  this.syncBtn.addEventListener("click", async () => {
      try {
        const sync = await import("../../utils/sync-outbox");
        const r = await sync.syncOutbox();
        if (r && r.synced && r.synced > 0) {
          if (window.Swal) window.Swal.fire("Synced", `${r.synced} items synced.`, "success");
          await this.loadAndRender();
        } else if (window.Swal) {
          window.Swal.fire("Nothing to sync", "No queued items found.", "info");
        }
      } catch (e) {
        console.error("sync failed", e);
        if (window.Swal) window.Swal.fire("Sync error", "Failed to sync outbox.", "error");
      }
    });

    await this.loadAndRender(userId);
  }

  async loadAndRender(userId) {
    const content = document.getElementById("favorite-content");
    try {
      const db = await import("../../utils/indexeddb");
  let localStories = await db.getAllStoriesFromDB();
  localStories = (localStories || []).filter((s) => String(s.id).startsWith("local-"));
      let favorites = [];
      if (userId) favorites = await db.getAllUserFavorites(userId);

      const byId = new Map();
      favorites.forEach((f) => byId.set(f.id, { ...f, source: 'favorite' }));
      localStories.forEach((s) => {
        if (!byId.has(s.id)) byId.set(s.id, { ...s, source: 'local' });
      });

      this.items = Array.from(byId.values());
      this.applyFilters();
    } catch (e) {
      console.error("load favorites/local stories failed", e);
      content.innerHTML = "<p>Failed to load saved/favorite stories.</p>";
    }
  }

  applyFilters() {
    const q = (this.searchEl.value || "").toLowerCase();
    const sort = this.sortEl.value;
    let list = Array.isArray(this.items) ? [...this.items] : [];
    if (q) {
      list = list.filter((it) => {
        return (
          (it.name || "").toLowerCase().includes(q) ||
          (it.description || "").toLowerCase().includes(q)
        );
      });
    }
    if (sort === "newest") list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    else if (sort === "oldest") list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    else if (sort === "title-asc") list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (sort === "title-desc") list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));

    this.renderList(list);
  }

  renderList(list) {
    const content = document.getElementById("favorite-content");
    content.innerHTML = "";
    if (!list || !list.length) {
      content.innerHTML = `<p>No favorites or saved stories yet.</p>`;
      return;
    }

    const listWrap = document.createElement("div");
    listWrap.className = "stories-list";

    list.forEach((s) => {
      const card = document.createElement("div");
      card.className = "story-card";
      const photo = s.photo || s.photoUrl || "";
      const created = s.createdAt ? new Date(s.createdAt).toLocaleString() : "";
      const name = s.name || "(no name)";
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
            <button class="delete-btn icon-btn" title="Delete" aria-label="Delete"><i data-feather="trash-2"></i></button>
          </div>
        </div>
      `;

      card.querySelector('.details-btn').addEventListener('click', () => {
        if (s.source === 'local' || String(s.id).startsWith('local-')) {
          if (window.Swal) window.Swal.fire('Local story', 'This is a locally saved story. You can sync it to the server when online.', 'info');
        } else {
          location.hash = `#/stories/${s.id}`;
        }
      });

      card.querySelector('.delete-btn').addEventListener('click', async () => {
        try {
          if (window.Swal) {
            const r = await window.Swal.fire({ title: 'Delete', text: 'Delete this saved/favorite story?', icon: 'warning', showCancelButton: true });
            if (!r.isConfirmed) return;
          }
          const db = await import('../../utils/indexeddb');
          if (s.source === 'favorite') {
            const userId = window.localStorage.getItem('userId');
            if (userId) await db.removeUserFavorite(userId, s.id);
          } else {
            await db.removeStoryFromDB(s.id);
          }
          card.remove();
        } catch (e) {
          console.error('delete error', e);
        }
      });

      listWrap.appendChild(card);
    });

    content.appendChild(listWrap);
    try { globalThis.feather?.replace(); } catch (e) {}
  }
}
