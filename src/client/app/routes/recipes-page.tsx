import RecipeEditor from "~/components/recipe-editor";
import RecipesList from "~/components/recipes-list";
import { useAsync, useServer } from "~/server";

const RecipesPage = () => {
  return (
    <div>
      <h2>Recipes</h2>
      <RecipesList />
      <h2>Add new</h2>
      <RecipeEditor recipe={undefined} />
    </div>
  );
};

export default RecipesPage;
