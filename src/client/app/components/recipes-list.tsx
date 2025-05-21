import { useClient } from "~/server";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useAsync } from "~/utils";
import { Marked, marked } from "marked";
import ListSubheader from "@mui/material/ListSubheader";
import Divider from "@mui/material/Divider";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import ListItemIcon from "@mui/material/ListItemIcon";
import { Fragment } from "react/jsx-runtime";

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
      sx={{ width: "100%", maxWidth: 600, bgcolor: "background.paper", margin: "0 auto", borderRadius: 2, boxShadow: 2 }}
    >
      {recipes.map((entry, index) => (
        <Fragment key={entry.id}>
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton component="a" href={`/recipes/${entry.id}`} sx={{ py: 2 }}>
              <ListItemIcon>
                <RestaurantMenuIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={entry.title}
                slotProps={{ primary: { fontWeight: "bold", fontSize: 18 } }}
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
