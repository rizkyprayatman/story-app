import HomePage from "../pages/home/home-page";
import NewStoryPage from "../pages/new-story/new-story-page";
import FavoritePage from "../pages/favorite/favorite-page";
import LoginPage from "../pages/auth/login-page";
import RegisterPage from "../pages/auth/register-page";
import StoriesPage from "../pages/stories/stories-page";
import StoryDetailPage from "../pages/stories/story-detail-page";

const routes = {
  "/": new HomePage(),
  "/new": new NewStoryPage(),
  "/stories": new StoriesPage(),
  "/stories/:id": new StoryDetailPage(),
  "/favorite": new FavoritePage(),
  "/login": new LoginPage(),
  "/register": new RegisterPage(),
};

export default routes;
