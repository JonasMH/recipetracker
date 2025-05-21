import { useClient } from "~/server";
import { useParams } from "react-router";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Link,
  Stack,
  ListItemIcon,
  Checkbox,
  ListItemButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useAsync, useLocalStorage } from "~/utils";
import { marked } from "marked";
import { useEffect, useState } from "react";

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
  const [descriptionMarkdown, setDescriptionMarkdown] = useState("");

  const [checkedIngredients, setCheckedIngredients] = useLocalStorage<{
    [key: string]: boolean;
  }>(`checkedIngredients${recipeId}`, {});

  useEffect(() => {
    if (recipeState.data?.description) {
      const html = marked.parse(recipeState.data.description) as string;
      setDescriptionMarkdown(html);
    } else {
      setDescriptionMarkdown("");
    }
  }, [recipeState.data?.description]);

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
        <Typography variant="h4" fontWeight="bold">
          {recipe.title}
          <Link href={`/recipes/${recipe.id}/edit`}>
            <EditIcon />
          </Link>
        </Typography>
      </Stack>
      <Typography variant="h5">Ingridients</Typography>
      <List>
        {(recipe.ingredients ?? []).map((ingredient, index) => (
          <ListItem key={index} disablePadding>
            <ListItemButton
              role={undefined}
              onClick={(e) => setCheckedIngredients({
                ...checkedIngredients,
                [ingredient.name]: !checkedIngredients[ingredient.name]
              })}
              dense
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={checkedIngredients[ingredient.name] ?? false}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              <ListItemText
                primary={`${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Typography variant="h5">Description</Typography>
      <Box mt={2} fontSize={18}>
        <span dangerouslySetInnerHTML={{ __html: descriptionMarkdown }} />
      </Box>
      <Typography variant="h5">Change History</Typography>
      <RecipeHistory recipeId={recipe.id} />
    </Box>
  );
};

export default RecipePage;
