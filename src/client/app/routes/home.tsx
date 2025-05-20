import { Paper, Stack } from "@mui/material";
import RecipeEditor from "~/components/recipe-editor";
import RecipesList from "~/components/recipes-list";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [{ title: "RT" }];
}

export default function Home() {
  return (
    <Stack spacing={2} sx={{ padding: 2 }}>
      <h2>Recipes</h2>
      <RecipesList />
    </Stack>
  );
}
