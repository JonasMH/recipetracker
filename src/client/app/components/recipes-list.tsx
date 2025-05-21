import { useClient } from "~/server";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CardActionArea from "@mui/material/CardActionArea";
import Grid2 from "@mui/material/Grid";
import { useAsync } from "~/utils";
import { Marked, marked } from "marked";

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
  const markedInstance = new Marked();

  return (
    <Grid2 container spacing={2}>
      {recipes.map((entry, index) => (
        <Grid2 size={{ xl: 3, lg: 3, md: 3, sm: 6, xs: 12 }} key={index}>
          <Card>
            <CardActionArea href={`/recipes/${entry.id}`}>
              <CardContent>
                <Typography variant="h6">{entry.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {markedInstance.parseInline(entry.description)}
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
