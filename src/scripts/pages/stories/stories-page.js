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
    const presenter = new HomePresenter({ viewContainer: this });
    await presenter.init();
  }
}
