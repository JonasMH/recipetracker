import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("recipes/:recipeId", "routes/recipe-page.tsx"),
  route("recipes/:recipeId/edit", "routes/recipe-edit-page.tsx"),
] satisfies RouteConfig;
