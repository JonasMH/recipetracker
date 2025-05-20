import { useAsync, useClient } from "~/server";
import { useParams } from "react-router";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Link,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

const RecipeHistory = (props: { recipeId: string }) => {
  const client = useClient();

  const historyState = useAsync(() => client.getRecipeHistory(props.recipeId));
  if (historyState.loading) {
    return <Typography>Loading...</Typography>;
  }
  if (historyState.error) {
    return (
      <Typography color="error">Error: {historyState.error.message}</Typography>
    );
  }
  const history = historyState.data!;
  return (
    <List sx={{ mt: 3, p: 0 }}>
      {history.map((entry, index) => (
        <ListItem key={index}>
          <ListItemText
            primary={`${entry.Message}`}
            secondary={`${new Date(entry.Committer.When).toLocaleString()} / ${
              entry.Author.Name
            }`}
          />
        </ListItem>
      ))}
    </List>
  );
};

const RecipePage = () => {
  const client = useClient();
  const recipeId = useParams().recipeId!;

  const recipeState = useAsync(() => client.getRecipe(recipeId));

  if (recipeState.loading) {
    return <Typography>Loading...</Typography>;
  }
  if (recipeState.error) {
    return (
      <Typography color="error">Error: {recipeState.error.message}</Typography>
    );
  }

  const recipe = recipeState.data!;

  return (
    <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto" }}>
      <Stack direction="row" spacing={2} mb={2}>
        <Typography variant="h3" fontWeight="bold" mb={2}>
          {recipe.title}
          <Link href={`/recipes/${recipe.id}/edit`}>
            <EditIcon />
          </Link>
        </Typography>
      </Stack>
      <Typography variant="h4">Ingridients</Typography>
      <List sx={{ mt: 3, p: 0 }}>
        {(recipe.ingredients ?? []).map((ingredient, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={`${ingredient.name} - ${ingredient.quantity} ${ingredient.unit}`}
            />
          </ListItem>
        ))}
      </List>
      <Typography variant="h4">Description</Typography>
      <Typography mt={2} fontSize={18}>
        {recipe.description}
      </Typography>
      <Typography variant="h4">Change History</Typography>
      <RecipeHistory recipeId={recipe.id} />
    </Box>
  );
};

export default RecipePage;
