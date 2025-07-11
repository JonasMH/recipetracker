import { Box, Button, Stack, TextField } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router";
import { type IRecipeLog, useClient } from "~/server";
import { useLocalStorage } from "~/utils";
export const RecipeLogEditor = (props: { log: IRecipeLog | undefined }) => {
  const orignalId = props.log?.id;

  const [form, setForm] = useState<IRecipeLog>(props.log ?? ({} as IRecipeLog));
  const [authorName, setAuthorName] = useLocalStorage<string | undefined>(
    "gitName",
    undefined
  );
  const [error, setError] = useState<string | undefined>(undefined);
  const client = useClient();
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);

    if ((authorName?.length ?? 0) < 5) {
      setError("Author name must be at least 5 characters long");
      return;
    }

    if (form.recipeId === undefined) {
      setError("Recipe ID is required");
      return;
    }

    try {
      const id = orignalId ?? Math.floor(Date.now() / 1000) + "";
      const result = await client.editRecipeLog(
        {
          ...form,
          id,
        },
        {
          message: `Changed log ${id} in recipe ${props.log?.recipeId}`,
          name: authorName!,
        }
      );
      navigate(`/recipes/${result.recipeId}`);
    } catch (err) {
      setError(err + "");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField
        label="Description"
        id="description"
        name="description"
        value={form.description ?? ""}
        required
        fullWidth
        margin="normal"
        multiline
        minRows={3}
        onChange={handleChange}
      />
      {/* Ingredients Section */}
      <Box sx={{ mt: 2, mb: 2 }}>
        <strong>Ingredients</strong>
        {(form.actualIngredients ?? []).map((ingredient, idx) => (
          <Box
            key={idx}
            sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}
          >
            <TextField
              label="Name"
              name={`ingredient-name-${idx}`}
              value={ingredient.name ?? ""}
              onChange={(e) => {
                const updated = [...(form.actualIngredients ?? [])];
                updated[idx] = { ...updated[idx], name: e.target.value };
                setForm({ ...form, actualIngredients: updated });
              }}
              size="small"
              sx={{ flex: 2 }}
            />
            <TextField
              label="Quantity"
              name={`ingredient-quantity-${idx}`}
              value={ingredient.quantity ?? ""}
              onChange={(e) => {
                const updated = [...(form.actualIngredients ?? [])];
                const numberValue = parseFloat(e.target.value);
                updated[idx] = { ...updated[idx], quantity: numberValue };
                setForm({ ...form, actualIngredients: updated });
              }}
              size="small"
              type="number"
              sx={{ flex: 1 }}
            />
            <TextField
              label="Unit"
              name={`ingredient-unit-${idx}`}
              value={ingredient.unit ?? ""}
              onChange={(e) => {
                const updated = [...(form.actualIngredients ?? [])];
                updated[idx] = { ...updated[idx], unit: e.target.value };
                setForm({ ...form, actualIngredients: updated });
              }}
              size="small"
              sx={{ flex: 1 }}
            />
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => {
                const updated = [...(form.actualIngredients ?? [])];
                updated.splice(idx, 1);
                setForm({ ...form, actualIngredients: updated });
              }}
              sx={{ minWidth: 0, px: 1 }}
            >
              -
            </Button>
          </Box>
        ))}
        <Button
          variant="outlined"
          size="small"
          sx={{ mt: 1 }}
          onClick={() => {
            setForm({
              ...form,
              actualIngredients: [
                ...(form.actualIngredients ?? []),
                { name: "", quantity: 0, unit: "" },
              ],
            });
          }}
        >
          Add Ingredient
        </Button>
      </Box>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Author Name"
          id="authorName"
          name="authorName"
          value={authorName}
          fullWidth
          margin="normal"
          onChange={(e) => setAuthorName(e.target.value)}
        ></TextField>
      </Stack>
      <Button
        type="submit"
        variant="contained"
        color="primary"
        sx={{ mt: 2, alignSelf: "flex-start" }}
      >
        Save
      </Button>
      {error && (
        <Box
          sx={{
            mt: 2,
            padding: 2,
            backgroundColor: "error.main",
            color: "white",
          }}
        >
          <h3>Error</h3>
          <p>{error}</p>
        </Box>
      )}
    </Box>
  );
};
