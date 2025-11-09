import routes from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";
import { sleep } from "../utils";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener("click", () => {
      this.#navigationDrawer.classList.toggle("open");
    });

    document.body.addEventListener("click", (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove("open");
      }

      this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove("open");
        }
      });
    });
  }

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];

    if (typeof document !== "undefined" && document.startViewTransition) {
      try {
        await document.startViewTransition(async () => {
          this.#content.innerHTML = await page.render();
          try {
            await page.afterRender();
          } catch (e) {
            console.error("page.afterRender error", e);
          }
        });
        return;
      } catch (e) {
        console.warn("View Transition API failed, falling back to CSS transitions", e);
      }
    }

    this.#content.classList.add("page-transition-out");
    await sleep(180);

    this.#content.innerHTML = await page.render();

    this.#content.classList.remove("page-transition-out");
    this.#content.classList.add("page-transition-in");

    await sleep(320);
    this.#content.classList.remove("page-transition-in");

    await page.afterRender();
  }
}

export default App;
