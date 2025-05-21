import { useClient } from "~/server";
import { useParams } from "react-router";
import {
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useAsync } from "~/utils";

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
            primary={`Changed by ${entry.Author.Name}`}
            secondary={`${new Date(entry.Committer.When).toLocaleString()}`}
          />
        </ListItem>
      ))}
    </List>
  );
};

const RecipeHistoryPage = () => {
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
      <h2>History for {recipe.title}</h2>
      <Paper>
        <RecipeHistory recipeId={recipe.id} />
      </Paper>
    </Stack>
  );
};

export default RecipeHistoryPage;
