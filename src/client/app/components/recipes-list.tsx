import { useAsync, useClient } from "~/server";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CardActionArea from "@mui/material/CardActionArea";
import Grid2 from "@mui/material/Grid";

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
    <Grid2 container spacing={2}>
      {recipes.map((entry, index) => (
        <Grid2 size={3} key={index}>
          <Card>
            <CardActionArea href={`/recipes/${entry.id}`}>
              <CardContent>
                <Typography variant="h6">{entry.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {entry.description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid2>
      ))}
    </Grid2>
  );
};

export default RecipesList;
