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
    const HomePresenter = (await import("../../presenters/home-presenter"))
      .default;
    const presenter = new HomePresenter({ viewContainer: this });
    await presenter.init();
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
          typeof window !== "undefined"
            ? window.localStorage.getItem("token")
            : null;
        btn.textContent = token ? "Start Posting" : "Start Posting as Guest";
        btn.addEventListener("click", () => {
          location.hash = "#/new";
        });
      }
    } catch (e) {
      console.error("Guest post button error", e);
    }
  }
}
