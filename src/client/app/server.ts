import { useState, useEffect, type DependencyList, useCallback } from "react";

export class RecipeClient {
  constructor() {}

  async editRecipe(
    recipe: IRecipe,
    commitMessage: string,
    author: string,
    email: string
  ): Promise<IRecipe> {
    const response = await fetch(
      `/api/recipes?commitMessage=${commitMessage}&author=${author}&email=${email}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recipe),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to edit recipe: " + (await response.text()));
    }
    return response.json();
  }

  async getRecipe(id: string): Promise<IRecipe> {
    const response = await fetch(`/api/recipes/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch recipe: " + (await response.text()));
    }
    return response.json();
  }

  async getRecipeHistory(id: string): Promise<ICommit[]> {
    const response = await fetch(`/api/recipes/${id}/history`);
    if (!response.ok) {
      throw new Error(
        "Failed to fetch recipe history: " + (await response.text())
      );
    }
    return response.json();
  }

  async getRecipeLogs(id: string): Promise<IRecipeLog[]> {
    const response = await fetch(`/api/recipes/${id}/logs`);
    if (!response.ok) {
      throw new Error(
        "Failed to fetch recipe logs: " + (await response.text())
      );
    }
    return response.json();
  }

  
  async editRecipeLog(
    recipe: IRecipeLog,
    commitMessage: string,
    author: string,
    email: string
  ): Promise<IRecipe> {
    const response = await fetch(
      `/api/recipes/${recipe.recipeId}/logs?commitMessage=${commitMessage}&author=${author}&email=${email}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recipe),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to create recipe log: " + (await response.text()));
    }
    return response.json();
  }

  async getRecipes(): Promise<IRecipe[]> {
    const response = await fetch(`/api/recipes`);
    if (!response.ok) {
      throw new Error("Failed to get recipes: " + (await response.text()));
    }
    return response.json();
  }

  async dbPush(): Promise<void> {
    const response = await fetch(`/api/db/push`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Failed to push database: " + (await response.text()));
    }
  }

  async dbPull(): Promise<void> {
    const response = await fetch(`/api/db/pull`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Failed to pull database: " + (await response.text()));
    }
  }
}

export function useClient(): RecipeClient {
  return new RecipeClient();
}

export interface IRecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface IRecipe {
  id: string;
  title: string;
  description: string;
  ingredients: Array<IRecipeIngredient>;
}

export interface IRecipeLog {
  id: string;
  recipeId: string;
  description: string;
  actualIngredients: IRecipeIngredient[] | undefined;
  commit: ICommit | undefined;
}


export interface ICommit {
  author: {
    name: string;
    email: string;
    when: string;
  };
  committer: {
    name: string;
    email: string;
    when: string;
  };
  message: string;
  hash: string;
}