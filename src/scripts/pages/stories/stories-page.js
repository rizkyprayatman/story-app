import HomePresenter from "../../presenters/home-presenter";

export default class StoriesPage {
  async render() {
    return `
      <section class="container">
        <h1>All Stories</h1>
        <div id="home-map" class="home-map" role="region" aria-label="Stories map"></div>
        <div id="stories-list" class="stories-list"></div>
      </section>
    `;
  }

  async afterRender() {
    this.presenter = new HomePresenter({ viewContainer: this });
    await this.presenter.init();
  }

  renderList(stories) {
    const listEl = document.getElementById('stories-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    stories.forEach((s) => {
      const card = document.createElement('div');
      card.className = 'story-card';
      const photo = s.photoUrl || '';
      const created = s.createdAt ? new Date(s.createdAt).toLocaleString() : '';
      const name = s.name || (s.owner && s.owner.name) || 'name user';
      const desc = (s.description || '').slice(0, 300);

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
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          if (id) location.hash = `#/stories/${id}`;
        });
      });

      listEl.querySelectorAll('.fav-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (!id) return;
          if (this.presenter && typeof this.presenter.toggleFavorite === 'function') {
            const res = await this.presenter.toggleFavorite(id);
            if (res === 'added') btn.classList.add('active');
            if (res === 'removed') btn.classList.remove('active');
          }
        });
      });

      try { globalThis.feather?.replace(); } catch (e) {
        console.error('feather replace error', e);
      }
    } catch (e) {
      console.error('renderList wiring error', e);
    }
  }

  initMap(stories) {
    if (this.presenter && typeof this.presenter.initMap === 'function') {
      try {
        this.presenter.initMap(stories);
        return;
      } catch (e) {
        console.error('presenter.initMap error', e);
      }
    }

    const mapEl = document.getElementById('home-map');
    if (!mapEl || !window.L) return;
    try {
      const map = L.map(mapEl).setView([0, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    } catch (e) {
      console.error('initMap fallback error', e);
    }
  }
}
