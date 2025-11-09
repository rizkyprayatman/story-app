export default class HomePage {
  async render() {
    return `
      <section class="hero container">
        <div class="hero-left">
          <h1 class="hero-title">Share Your Story Anywhere</h1>
          <p class="hero-desc">With Story App, you can share your stories with location tags and upload photos to bring your moments to life.</p>
          <div class="hero-actions">
            <a href="#/new" class="btn post-btn">Post Now</a>
          </div>
        </div>

        <div class="hero-right">
          <img class="hero-illustration" src="images/hero.png" alt="Illustration" />
        </div>
      </section>

      <section class="container">
        <div class="map-wrapper">
          <div id="home-map" class="home-map" role="region" aria-label="Stories map"></div>
        </div>
          <div class="guest-cta">
            <button id="guest-post-btn" class="btn guest-btn">Start Posting as Guest</button>
          </div>
      </section>
    `;
  }

  async afterRender() {
    const HomePresenter = (await import("../../presenters/home-presenter")).default;

    this.presenter = new HomePresenter({ viewContainer: this });
    await this.presenter.init();
    try {
      const feather = (await import("feather-icons")).default;
      try {
        feather.replace();
      } catch (e) {
        console.error("Feather icons replacement error", e);
      }
    } catch (e) {
      console.error("Feather icons import error", e);
    }

    try {
      const btn = document.getElementById("guest-post-btn");
      if (btn) {
        const token =
          typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
        btn.textContent = token ? "Start Posting" : "Start Posting as Guest";
        btn.addEventListener("click", () => {
          location.hash = "#/new";
        });
      }
    } catch (e) {
      console.error("Guest post button error", e);
    }
  }

  renderList(stories) {
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
            <button class="details-btn btn" data-id="${s.id}">Details</button>
            <button class="fav-btn" title="Save to favorites" aria-label="Save to favorites" data-id="${s.id}"><i data-feather="star"></i></button>
          </div>
        </div>
      `;

      listEl.appendChild(card);
    });

    try {
      listEl.querySelectorAll('.details-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const id = btn.getAttribute('data-id');
          if (id) location.hash = `#/stories/${id}`;
        });
      });

      listEl.querySelectorAll('.fav-btn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          const id = btn.getAttribute('data-id');
          if (!id) return;
          try {
            if (this.presenter && typeof this.presenter.toggleFavorite === 'function') {
              const result = await this.presenter.toggleFavorite(id);
              if (result === 'added') btn.classList.add('active');
              if (result === 'removed') btn.classList.remove('active');
            }
          } catch (err) {
            console.error('fav click error', err);
          }
        });
      });

      try {
        globalThis.feather?.replace();
      } catch (e) {
        console.error('Feather icons replacement error', e);
      }
    } catch (e) {
      console.error('renderList wiring error', e);
    }
  }

  initMap(stories) {
    const mapEl = document.getElementById('home-map');
    if (!mapEl || !window.L) return;
    const MAP_TILE_URL = (async () => null)();
    if (this.presenter && typeof this.presenter.initMap === 'function') {
      try {
        this.presenter.initMap(stories);
      } catch (e) {
        console.error('presenter.initMap error', e);
      }
    }
  }
}
