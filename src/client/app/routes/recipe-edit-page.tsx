import { useClient } from "~/server";
import { useParams } from "react-router";
import { Paper, Stack, Typography } from "@mui/material";
import RecipeEditor from "~/components/recipe-editor";
import { useAsync } from "~/utils";

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
      <Typography variant="h5">Edit {recipe.title}</Typography>
      <RecipeEditor recipe={recipe} />
    </Stack>
  );
};

export default RecipeEditPage;
