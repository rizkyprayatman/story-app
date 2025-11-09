import AuthPresenter from "../../presenters/auth-presenter";

export default class LoginPage {
  async render() {
    return `
      <section class="container">
        <div class="auth-card">
          <h1>Login</h1>
          <form id="login-form">
            <label for="email">Email</label>
            <input id="email" type="email" name="email" required />

            <label for="password">Password</label>
            <input id="password" type="password" name="password" required />

            <button type="submit">Login</button>
          </form>
          <p>Don't have an account? <a href="#/register">Register</a></p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const presenter = new AuthPresenter({ view: this });
    presenter.bindLogin();
  }
}
