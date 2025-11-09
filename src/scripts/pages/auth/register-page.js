import AuthPresenter from "../../presenters/auth-presenter";

export default class RegisterPage {
  async render() {
    return `
      <section class="container">
        <div class="auth-card">
          <h1>Register</h1>
          <form id="register-form">
            <label for="name">Full Name</label>
            <input id="name" name="name" type="text" required />

            <label for="email">Email</label>
            <input id="email" name="email" type="email" required />

            <label for="password">Password</label>
            <input id="password" name="password" type="password" required />

            <button type="submit">Register</button>
          </form>
          <p>Already have an account? <a href="#/login">Login</a></p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const presenter = new AuthPresenter({ view: this });
    presenter.bindRegister();
  }
}
