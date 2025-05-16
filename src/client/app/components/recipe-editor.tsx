import React from "react";
import type { IRecipe } from "~/server";

const RecipeEditor = (props: { recipe: IRecipe | undefined }) => {
  var recipe = props.recipe ?? ({} as IRecipe);

  return (
    <div>
      <h1
        style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}
      >
        Add / Update Recipe
      </h1>
      <form
        method="POST"
        action={`/recipes/${recipe.id}`}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <div>
          <label
            htmlFor="id"
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Id
          </label>
          <input
            type="text"
            id="id"
            name="id"
            value={recipe.id}
            required
            disabled={!!recipe.id}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <div>
          <label
            htmlFor="title"
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={recipe.title}
            required
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <div>
          <label
            htmlFor="description"
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={recipe.description}
            required
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              resize: "vertical",
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Save
        </button>
      </form>
    </div>
  );
};

export default RecipeEditor;
