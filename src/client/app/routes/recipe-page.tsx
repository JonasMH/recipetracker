import "~/print.css";
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
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import { useAsync, useLocalStorage } from "~/utils";
import { marked } from "marked";
import { useMemo } from "react";
import { Print } from "@mui/icons-material";
import { DateTime } from "luxon";

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
          <span className="print-hide">
            <IconButton
              LinkComponent={Link}
              href={`/recipes/${recipe.id}/edit`}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              LinkComponent={Link}
              href={`/recipes/${recipe.id}/history`}
            >
              <HistoryIcon />
            </IconButton>
            <IconButton onClick={() => window.print()}>
              <Print />
            </IconButton>
          </span>
        </Typography>
      </Stack>
      <Typography variant="h5">Ingridients</Typography>
      <List>
        {(recipe.ingredients ?? []).map((ingredient, index) => (
          <ListItem key={index} disablePadding>
            <ListItemButton
              className="print-hide"
              role={undefined}
              onClick={(e) =>
                setCheckedIngredients({
                  ...checkedIngredients,
                  [ingredient.name]: !checkedIngredients[ingredient.name],
                })
              }
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
            {/* For print, show ingredient as plain text */}
            <span
              className="print-only"
              style={{ display: "none" }}
            >{`${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`}</span>
          </ListItem>
        ))}
      </List>
      <Typography variant="h5">Description</Typography>
      <Box mt={2} fontSize={18}>
        <span dangerouslySetInnerHTML={{ __html: descriptionMarkdown }} />
      </Box>
      {/* Print-only footer with source */}
      <Box
        className="print-only"
        sx={{
          display: "none",
          position: "fixed",
          bottom: 0,
          mt: 4,
          textAlign: "center",
          fontSize: 12,
          color: "#888",
        }}
      >
        {DateTime.now().toFormat("yyyy-MM-dd'T'HH:mmZZ")}{" "}
        <a href={window.location.href}>{window.location.href}</a>
      </Box>
    </Box>
  );
};

export default RecipePage;
