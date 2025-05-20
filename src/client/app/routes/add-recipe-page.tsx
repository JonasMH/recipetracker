import { Paper, Stack } from "@mui/material";
import RecipeEditor from "~/components/recipe-editor";
import type { Route } from "./+types/add-recipe-page";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RT - Add Recipe" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

const AddRecipePage = () => {
  return (
    <Stack spacing={2} sx={{ padding: 2 }}>
      <h2>Add new</h2>
      <Paper>
        <RecipeEditor recipe={undefined} />
      </Paper>
    </Stack>
  );
};

export default AddRecipePage;
