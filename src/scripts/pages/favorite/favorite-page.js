export default class FavoritePage {
  async render() {
    return `
      <section class="container">
        <h1>Favorite</h1>
        <div id="favorite-content"></div>
      </section>
    `;
  }

  async afterRender() {
    const content = document.getElementById("favorite-content");

    const userId = window.localStorage.getItem("userId") || null;
    if (!userId) {
      content.innerHTML = `
        <p>Please <a href="#/login">login</a> to view your favorites.</p>
      `;
      return;
    }

    const db = await import("../../utils/indexeddb");
    const favorites = await db.getAllUserFavorites(userId);
    if (!favorites || !favorites.length) {
      content.innerHTML = `
        <p>No favorites yet. Go to <a href="#/stories">Stories</a> and save some.</p>
      `;
      return;
    }

    content.innerHTML = "";
    const listWrap = document.createElement("div");
    listWrap.className = "stories-list";

    favorites.forEach((s) => {
      const card = document.createElement("div");
      card.className = "story-card";
      const photo = s.photo || "";
      const created = s.createdAt ? new Date(s.createdAt).toLocaleString() : "";
      const name = s.name || "name user";
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
            <button class="fav-remove-btn icon-btn" title="Remove from favorites" aria-label="Remove from favorites"><i data-feather="trash-2"></i></button>
          </div>
        </div>
      `;

      const detailsBtn = card.querySelector(".details-btn");
      detailsBtn.addEventListener("click", () => {
        location.hash = `#/stories/${s.id}`;
      });

      const removeBtn = card.querySelector(".fav-remove-btn");
      removeBtn.addEventListener("click", async () => {
        try {
          const id = s.id;
          const db = await import("../../utils/indexeddb");
          await db.removeUserFavorite(userId, id);
          card.remove();
          const remaining = await db.getAllUserFavorites(userId);
          if (!remaining.length) {
            content.innerHTML = `\n            <p>No favorites yet. Go to <a href="#/stories">Stories</a> and save some.</p>\n          `;
          }
        } catch (err) {
          console.error("remove favorite error", err);
        }
      });

      listWrap.appendChild(card);
    });

    content.appendChild(listWrap);
    try {
      globalThis.feather?.replace();
    } catch (e) {
      console.error("Feather icons replacement error", e);
    }
  }
}
