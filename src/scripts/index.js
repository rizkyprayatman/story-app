import "../styles/styles.css";

import App from "./pages/app";
import pushNotifications from "./utils/push-notifications";
import feather from "feather-icons";

try {
  const IS_PROD =
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV === "production";
  if (!IS_PROD) {
    window.addEventListener("error", (event) => {
      try {
        if (
          event &&
          event.filename &&
          event.filename.startsWith("chrome-extension://")
        ) {
          console.warn(
            "Ignored extension error from",
            event.filename,
            event.message
          );
          event.preventDefault();
          return true;
        }
      } catch (e) {
        console.error("Error handling window error event", e);
      }
      return false;
    });

    window.addEventListener("unhandledrejection", (event) => {
      try {
        const reason = event && event.reason;
        const stack = reason && reason.stack ? String(reason.stack) : "";
        if (stack.includes("chrome-extension://")) {
          console.warn("Ignored extension promise rejection", reason);
          event.preventDefault();
        }
      } catch (e) {
        console.error("Error handling unhandledrejection event", e);
      }
    });
  }
} catch (e) {
  console.error("Error setting up global error handlers", e);
}

document.addEventListener("DOMContentLoaded", async () => {
  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });
  await app.renderPage();
  try {
    feather.replace();
  } catch (e) {
    console.error("Error replacing feather icons", e);
  }

  const authActions = document.getElementById("auth-actions");
  function renderAuth() {
    if (!authActions) return;
    const token = window.localStorage.getItem("token");
    if (token) {
      const name = window.localStorage.getItem("name") || "";
      authActions.innerHTML = `
        <span class="user-area">
          <button id="notif-btn" class="auth-btn" title="Notifications"><i data-feather="bell"></i></button>
          <span id="notif-menu" class="notif-menu" style="display:none"></span>
          <span id="user-name" class="user-name">${name}</span>
          <button id="logout-btn" class="auth-btn">Logout</button>
        </span>`;

      const logoutBtn = document.getElementById("logout-btn");
      logoutBtn.addEventListener("click", () => {
        window.localStorage.removeItem("token");
        window.localStorage.removeItem("name");
        window.localStorage.removeItem("userId");
        location.hash = "#/";
        renderAuth();
      });

      pushNotifications.registerServiceWorker().catch(() => {});

      const notifBtn = document.getElementById("notif-btn");
      const notifMenu = document.getElementById("notif-menu");
      async function refreshNotifMenu() {
        const subscribed = await pushNotifications.isSubscribed();
        notifMenu.innerHTML = "";
        const btn = document.createElement("button");
        btn.className = "auth-btn";
        btn.style.marginLeft = "8px";
        if (subscribed) {
          btn.textContent = "Unsubscribe";
          btn.addEventListener("click", async () => {
            try {
              const res = await pushNotifications.unsubscribeUser();
              if (window.Swal)
                window.Swal.fire(
                  "Unsubscribed",
                  (res && res.resp && res.resp.message) ||
                    "Unsubscribed from notifications",
                  "success"
                );
              refreshNotifMenu();
            } catch (err) {
              if (window.Swal)
                window.Swal.fire(
                  "Error",
                  err.message || "Failed to unsubscribe",
                  "error"
                );
            }
          });
        } else {
          btn.textContent = "Subscribe";
          btn.addEventListener("click", async () => {
            try {
              const { resp } = await pushNotifications.subscribeUser();
              if (window.Swal)
                window.Swal.fire(
                  "Subscribed",
                  (resp && resp.message) || "Subscribed to notifications",
                  "success"
                );
              refreshNotifMenu();
            } catch (err) {
              if (window.Swal)
                window.Swal.fire(
                  "Error",
                  err.message || "Failed to subscribe",
                  "error"
                );
            }
          });
        }
        notifMenu.appendChild(btn);
      }

      notifBtn.addEventListener("click", async () => {
        if (notifMenu.style.display === "none") {
          await refreshNotifMenu();
          notifMenu.style.display = "inline-block";
        } else notifMenu.style.display = "none";
      });
    } else {
      authActions.innerHTML = `<a class="auth-btn register-btn" href="#/register">Register</a>
      <a class="auth-btn login-btn" href="#/login">Login</a>`;
    }
  }
  renderAuth();

  try {
    feather.replace();
  } catch (e) {
    console.error("Error replacing feather icons", e);
  }

    try {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
      }
    } catch (e) {
      console.error("Error registering service worker", e);
    }

  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installWrapper = document.getElementById("auth-actions");
    if (installWrapper) {
      const existing = document.getElementById("install-btn");
      if (!existing) {
        const btn = document.createElement("button");
        btn.id = "install-btn";
        btn.className = "auth-btn";
        btn.textContent = "Install App";
        btn.addEventListener("click", async () => {
          try {
            deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            deferredPrompt = null;
            btn.remove();
          } catch (err) {
            console.error("Error handling beforeinstallprompt event", err);
          }
        });
        installWrapper.prepend(btn);
      }
    }
  });

  window.addEventListener("hashchange", async () => {
    await app.renderPage();
    renderAuth();
    try {
      feather.replace();
    } catch (e) {
      console.error("Error replacing feather icons", e);
    }
  });
});
