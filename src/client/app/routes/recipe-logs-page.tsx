import { useClient, type IRecipe, type IRecipeLog } from "~/server";
import { useNavigate, useParams } from "react-router";
import {
  Card,
  CardContent,
  Grid,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useAsync } from "~/utils";
import { RecipeLogEditor } from "~/components/recipe-log-editor";
import EditIcon from "@mui/icons-material/Edit";

export const RecipeLogs = (props: { recipeId: string }) => {
  const client = useClient();
  const historyState = useAsync(() => client.getRecipeLogs(props.recipeId));

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
    <Grid container sx={{ mt: 3, p: 0 }}>
      {history.map((entry, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={entry.id}>
          <Card>
            <CardContent>
              <Typography gutterBottom variant="h6" component="div">
                By {entry.commit?.author.name}{" "}
                {entry.commit?.author.when &&
                  new Date(entry.commit?.author.when).toLocaleString()}
                <IconButton
                  LinkComponent={Link}
                  href={`/recipes/${entry.recipeId}/logs/${entry.id}/edit`}
                >
                  <EditIcon />
                </IconButton>
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {entry.description}
                <List>
                  {entry.actualIngredients?.map((ingredient, idx) => (
                    <ListItem>
                      <ListItemText
                        primary={`${ingredient.name} ${ingredient.quantity} ${ingredient.unit}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

const RecipeLogsPage = () => {
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
      <Typography variant="h5" sx={{ mt: 2 }}>
        Logs for <Link href={`/recipes/${recipe.id}`}>{recipe.title}</Link>
      </Typography>
      <RecipeLogs recipeId={recipe.id} />
      <Typography variant="h5" sx={{ mt: 2 }}>
        Add Log
      </Typography>
      <Paper sx={{ padding: 2 }}>
        <RecipeLogEditor log={{ recipeId: recipe.id } as IRecipeLog} />
      </Paper>
    </Stack>
  );
};

export default RecipeLogsPage;
