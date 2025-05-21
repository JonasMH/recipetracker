import { useClient } from "~/server";
import { useParams } from "react-router";
import type { Route } from "./+types/recipe-edit-page";
import { Paper, Stack } from "@mui/material";
import RecipeEditor from "~/components/recipe-editor";
import { useAsync } from "~/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

const RecipeEditPage = () => {
  const client = useClient();
  const recipeId = useParams().recipeId!;

  const recipeState = useAsync(() => client.getRecipe(recipeId));

  if (recipeState.loading) {
    return <div>Loading...</div>;
  }
  if (recipeState.error) {
    return <div>Error: {recipeState.error.message}</div>;
  }

  const recipe = recipeState.data!;

  return (
    <Stack spacing={2} sx={{ padding: 2 }}>
      <h2>Edit {recipe.title}</h2>
      <Paper>
        <RecipeEditor recipe={recipe} />
      </Paper>
    </Stack>
  );
};

export default RecipeEditPage;
