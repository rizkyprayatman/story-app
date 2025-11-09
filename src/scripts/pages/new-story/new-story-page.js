export default class NewStoryPage {
  constructor() {
    this._stream = null;
    this._markerLatLng = null;
  }

  async render() {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("token")
        : null;
    return `
      <section class="container">
        <div class="new-story-card">
          <header class="card-header">
            <h1 class="card-title">Create New Story</h1>
            ${
              !token
                ? '<div class="guest-note">You are posting as <strong>Guest</strong></div>'
                : ""
            }
          </header>

          <form id="new-story-form" class="new-story-form">
            <div class="form-group">
              <label for="description">Story Description</label>
              <textarea id="description" name="description" rows="4" placeholder="Enter your description..." required></textarea>
            </div>

            <div class="form-group">
              <label>Photo</label>
              <div class="photo-controls">
                <input type="file" id="photo-input" accept="image/*" aria-label="Select photo" />
                <button type="button" id="start-camera" class="btn">Take Photo</button>
                <button type="button" id="capture-photo" class="btn" style="display:none">Capture</button>
              </div>
              <div id="photo-preview" class="photo-preview" aria-live="polite"></div>
            </div>

            <div class="form-group">
              <label>Choose Location</label>
              <div id="story-map" class="story-map" role="region" aria-label="Pick location on map"></div>
              <div class="coords">
                <input type="hidden" id="lat" name="lat" />
                <input type="hidden" id="lon" name="lon" />
              </div>
            </div>

            <div class="form-actions">
              <button id="post-story" type="submit" class="post-btn">Post Story</button>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const NewStoryPresenter = (
      await import("../../presenters/new-story-presenter")
    ).default;
    const presenter = new NewStoryPresenter({ view: this });
    await presenter.init();
  }

  _stopStream() {
    if (this._stream) {
      this._stream.getTracks().forEach((t) => t.stop());
      this._stream = null;
    }
  }

  async beforeUnmount() {
    this._stopStream();
  }
}
