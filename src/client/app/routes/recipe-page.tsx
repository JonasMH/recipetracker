import React from "react";
import MainLayout from "../components/main-layout";
import { useAsync, useServer } from "~/server";
import { useParams } from "react-router";

const RecipePage = () => {
  const client = useServer();
  const recipeId = useParams().recipeId!;

  const recipeState = useAsync(() => client.getRecipe(recipeId));

  if (recipeState.loading) {
    return <div>Loading...</div>;
  }
  if (recipeState.error) {
    return <div>Error: {recipeState.error.message}</div>;
  }

  const recipe = recipeState.data!;

  return (
    <div>
      <h1
        style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "16px" }}
      >
        {recipe.title}
      </h1>
      <a
        href={`/recipes/${recipe.id}/edit`}
        style={{ color: "#007bff", textDecoration: "none" }}
      >
        Edit
      </a>
      <p style={{ marginTop: "16px", fontSize: "18px" }}>
        {recipe.description}
      </p>
      <ul style={{ marginTop: "24px", listStyle: "none", padding: 0 }}>
        {recipe.ingredients.map((ingredient, index) => (
          <li
            key={index}
            style={{
              fontSize: "14px",
              backgroundColor: "#444",
              padding: "8px",
              borderRadius: "4px",
            }}
          >
            {ingredient.name} - {ingredient.quantity} {ingredient.unit}
          </li>
        ))}
      </ul>
      {/* <h2 style={{ fontSize: "24px", fontWeight: "600", marginTop: "32px" }}>
        History
      </h2>
      <ul style={{ marginTop: "16px", listStyle: "none", padding: 0 }}>
        {history.map((entry, index) => (
          <li
            key={index}
            style={{
              fontSize: "14px",
              backgroundColor: "#444",
              padding: "8px",
              borderRadius: "4px",
            }}
          >
            {new Date(entry.Committer.When).toLocaleString()} - {entry.Message}{" "}
            by {entry.Author.Name}
          </li>
        ))}
      </ul> */}
    </div>
  );
};

export default RecipePage;
