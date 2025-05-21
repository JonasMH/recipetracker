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
import HistoryIcon from "@mui/icons-material/History";
import { useAsync, useLocalStorage } from "~/utils";
import { marked } from "marked";
import { useMemo } from "react";

const RecipePage = () => {
  const client = useClient();
  const recipeId = useParams().recipeId!;

  const recipeState = useAsync(() => client.getRecipe(recipeId));

  const descriptionMarkdown = useMemo(() => {
    if (recipeState.data?.description) {
      return marked.parse(recipeState.data.description) as string;
    }
    return "";
  }, [recipeState.data?.description]);

  const [checkedIngredients, setCheckedIngredients] = useLocalStorage<{
    [key: string]: boolean;
  }>(`checkedIngredients${recipeId}`, {});

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
    <Box sx={{ m: 2 }}>
      <Stack direction="row" spacing={2} mb={2}>
        <Typography variant="h4" fontWeight="bold">
          {recipe.title}
          <Link href={`/recipes/${recipe.id}/edit`}>
            <EditIcon />
          </Link>
          <Link href={`/recipes/${recipe.id}/history`}>
            <HistoryIcon />
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
    </Box>
  );
};

export default RecipePage;
