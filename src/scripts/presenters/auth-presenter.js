import { registerUser, loginUser } from "../data/api";
import { showLoading, hideLoading } from "../utils/loading";

export default class AuthPresenter {
  constructor({ view }) {
    this._view = view;
  }

  bindRegister() {
    const form = document.getElementById("register-form");
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      try {
        showLoading("Registering...");
        const res = await registerUser({ name, email, password });

        if (res && !res.error) {
          if (window.Swal)
            window.Swal.fire(
              "Success",
              "Registration successful. Please login.",
              "success"
            );
          else alert("Registration successful. Please login.");
          location.hash = "#/login";
        } else {
          console.error("registration failed", res);
          if (window.Swal)
            window.Swal.fire(
              "Error",
              res.message ||
                `Registration failed${
                  res.status ? " (" + res.status + ")" : ""
                }`,
              "error"
            );
          else
            alert(
              res.message ||
                `Registration failed${
                  res.status ? " (" + res.status + ")" : ""
                }`
            );
        }
      } catch (err) {
        console.error("register error", err);
        if (window.Swal)
          window.Swal.fire(
            "Error",
            err.message || "Registration failed",
            "error"
          );
        else alert(err.message || "Registration failed");
      } finally {
        hideLoading();
      }
    });
  }

  bindLogin() {
    const form = document.getElementById("login-form");
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      try {
        showLoading("Logging in...");
        const res = await loginUser({ email, password });

        if (res && res.error) {
          console.error("login failed", res);
        }
        const token =
          (res && res.loginResult && res.loginResult.token) ||
          res.token ||
          null;
        const name =
          (res && res.loginResult && res.loginResult.name) || res.name || null;
        const userId =
          (res && res.loginResult && res.loginResult.userId) ||
          res.userId ||
          null;
        if (token) {
          window.localStorage.setItem("token", token);
          if (name) window.localStorage.setItem("name", name);
          if (userId) window.localStorage.setItem("userId", userId);
          if (window.Swal)
            window.Swal.fire(
              "Success",
              `Welcome${name ? " " + name : ""}`,
              "success"
            );
          else alert("Login successful");
          location.hash = "#/";
        } else {
          if (window.Swal)
            window.Swal.fire("Error", res.message || "Login failed", "error");
          else alert(res.message || "Login failed");
        }
      } catch (err) {
        console.error("login error", err);
        if (window.Swal)
          window.Swal.fire("Error", err.message || "Login failed", "error");
        else alert(err.message || "Login failed");
      } finally {
        hideLoading();
      }
    });
  }
}
