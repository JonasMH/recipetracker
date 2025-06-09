import { useClient, type IRecipeLog } from "~/server";
import { useParams } from "react-router";
import { useAsync } from "~/utils";
import { RecipeLogEditor } from "~/components/recipe-log-editor";

const RecipeLogEditPage = () => {
  const client = useClient();
  const recipeId = useParams().recipeId!;
  const logId = useParams().logId!;

  const recipeLogState = useAsync(() => client.getRecipeLog(recipeId, logId));

  if (recipeLogState.loading) {
    return <div>Loading...</div>;
  }
  if (recipeLogState.error) {
    return <div>Error: {recipeLogState.error.message}</div>;
  }

  const recipeLog = recipeLogState.data!;

  return <RecipeLogEditor log={recipeLog} />;
};

export default RecipeLogEditPage;
