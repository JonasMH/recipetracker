import { useState, useEffect, type DependencyList, useCallback } from "react";

export class RecipePageServer {
  constructor() {}

  async editRecipe(recipe: IRecipe, commitMessage: string): Promise<IRecipe> {
    const response = await fetch(
      `/api/recipes?commitMessage=${commitMessage}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recipe),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch recipe");
    }
    return response.json();
  }

  async getRecipe(id: string): Promise<IRecipe> {
    const response = await fetch(`/api/recipes/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch recipe");
    }
    return response.json();
  }

  async getRecipeHistory(id: string): Promise<any[]> {
    const response = await fetch(`/api/recipes/${id}/history`);
    if (!response.ok) {
      throw new Error("Failed to fetch recipe history");
    }
    return response.json();
  }

  async getRecipes(): Promise<IRecipe[]> {
    const response = await fetch(`/api/recipes`);
    if (!response.ok) {
      throw new Error("Failed to fetch recipes");
    }
    return response.json();
  }
}

export function useServer(): RecipePageServer {
  return new RecipePageServer();
}

export interface IRecipe {
  id: string;
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    quantity: string;
    unit: string;
  }>;
}

export function useAsync<T>(
  callback: () => Promise<T>,
  deps?: DependencyList
): { loading: boolean; data: T | null; error: Error | null } {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const callbackMemoized = useCallback(() => {
    setLoading(true);
    setError(undefined!);
    setData(undefined!);
    callback()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, deps ?? []);

  useEffect(() => callbackMemoized(), [callbackMemoized]);

  return { loading, data, error };
}
