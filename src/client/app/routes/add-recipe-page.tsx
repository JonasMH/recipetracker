import { Paper, Stack, Typography } from "@mui/material";
import RecipeEditor from "~/components/recipe-editor";

const AddRecipePage = () => {
  return (
    <Stack spacing={2} sx={{ padding: 2 }}>
      <Typography variant="h5">Add new recipe</Typography>
      <RecipeEditor recipe={undefined} />
    </Stack>
  );
};

export default AddRecipePage;
