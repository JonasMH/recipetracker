import { useAsync, useServer } from "~/server";

const RecipesList = () => {
  const client = useServer();
  const recipesState = useAsync(() => client.getRecipes());

  if (recipesState.loading) {
    return <div>Loading...</div>;
  }
  if (recipesState.error) {
    return <div>Error: {recipesState.error.message}</div>;
  }

  const recipes = recipesState.data!;

  return (
    <ul style={{ marginTop: "16px", listStyle: "none", padding: 0 }}>
      {recipes.map((entry, index) => (
        <li
          key={index}
          style={{
            fontSize: "14px",
            backgroundColor: "#444",
            padding: "8px",
            borderRadius: "4px",
          }}
        >
          <a href={`/recipes/${entry.id}`}>{entry.title}</a>
        </li>
      ))}
    </ul>
  );
};

export default RecipesList;
