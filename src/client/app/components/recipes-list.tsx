import { useClient } from "~/server";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useAsync } from "~/utils";
import Divider from "@mui/material/Divider";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import ListItemIcon from "@mui/material/ListItemIcon";
import { Fragment } from "react/jsx-runtime";
import { Link } from "@mui/material";

const RecipesList = () => {
  const client = useClient();
  const recipesState = useAsync(() => client.getRecipes());

  if (recipesState.loading) {
    return <div>Loading...</div>;
  }
  if (recipesState.error) {
    return <div>Error: {recipesState.error.message}</div>;
  }

  const recipes = recipesState.data!;

  return (
    <List
      disablePadding
      sx={{
        height: '100%',
        overflowY: 'scroll',
        scrollbarGutter: 'stable', // Always reserve space for scrollbar
        minHeight: 200, // Optional: ensures a minimum height
      }}
    >
      {recipes.map((entry, index) => (
        <Fragment key={entry.id}>
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              component={Link}
              href={`/recipes/${entry.id}`}
              sx={{ py: 2 }}
            >
              <ListItemIcon>
                <RestaurantMenuIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={entry.title}
                slotProps={{primary: { fontWeight: "bold", fontSize: 18 }}}
              />
            </ListItemButton>
          </ListItem>
          {index < recipes.length - 1 && <Divider component="li" />}
        </Fragment>
      ))}
    </List>
  );
};

export default RecipesList;
