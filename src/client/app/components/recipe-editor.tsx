import React, { useState } from "react";
import { useClient, type IRecipe } from "~/server";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router";
import { useLocalStorage } from "~/utils";
import { Stack } from "@mui/material";

const RecipeEditor = (props: { recipe: IRecipe | undefined }) => {
  const orignalId = props.recipe?.id;

  const [form, setForm] = useState<IRecipe>(props.recipe ?? ({} as IRecipe));
  const [authorName, setAuthorName] = useLocalStorage<string | undefined>(
    "gitName",
    undefined
  );
  const [authorEmail, setAuthorEmail] = useLocalStorage<string | undefined>(
    "gitEmail",
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

    if ((authorEmail?.length ?? 0) < 5) {
      setError("Author email must be at least 5 characters long");
      return;
    }

    try {
      // Convert title to a slug: lowercase, a-z, 0-9, and -
      const slugify = (str: string) =>
        str
          .normalize("NFD") // decompose accents
          .replace(/[\u0300-\u036f]/g, "") // remove accents
            .toLowerCase()
            .replace(/[åäàáâãā]/g, "aa")
            .replace(/[æ]/g, "ae")
            .replace(/[öòóôõōø]/g, "oe")
            .replace(/[üúùûū]/g, "u")
            .replace(/[éèêëē]/g, "e")
            .replace(/[íìîïī]/g, "i")
            .replace(/[ç]/g, "c")
            .replace(/[ñ]/g, "n")
            .replace(/[^a-z0-9]+/g, "-") // replace non a-z0-9 with -
          .replace(/^-+|-+$/g, "") // trim leading/trailing -
          .replace(/--+/g, "-"); // collapse multiple -

      const id = orignalId ?? slugify(form.title ?? "");

      const result = await client.editRecipe(
        { 
          ...form,
          id,
        },
        `Changed ${id}`,
        authorName!,
        authorEmail!
      );
      navigate(`/recipes/${result.id}`);
    } catch (err) {
      setError(err + "");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField
        label="Title"
        id="title"
        name="title"
        value={form.title ?? ""}
        required
        fullWidth
        margin="normal"
        onChange={handleChange}
      />
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
        {(form.ingredients ?? []).map((ingredient, idx) => (
          <Box
            key={idx}
            sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}
          >
            <TextField
              label="Name"
              name={`ingredient-name-${idx}`}
              value={ingredient.name ?? ""}
              onChange={(e) => {
                const updated = [...(form.ingredients ?? [])];
                updated[idx] = { ...updated[idx], name: e.target.value };
                setForm({ ...form, ingredients: updated });
              }}
              size="small"
              sx={{ flex: 2 }}
            />
            <TextField
              label="Quantity"
              name={`ingredient-quantity-${idx}`}
              value={ingredient.quantity ?? ""}
              onChange={(e) => {
                const updated = [...(form.ingredients ?? [])];
                const numberValue = parseFloat(e.target.value);
                updated[idx] = { ...updated[idx], quantity: numberValue };
                setForm({ ...form, ingredients: updated });
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
                const updated = [...(form.ingredients ?? [])];
                updated[idx] = { ...updated[idx], unit: e.target.value };
                setForm({ ...form, ingredients: updated });
              }}
              size="small"
              sx={{ flex: 1 }}
            />
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => {
                const updated = [...(form.ingredients ?? [])];
                updated.splice(idx, 1);
                setForm({ ...form, ingredients: updated });
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
              ingredients: [
                ...(form.ingredients ?? []),
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
        <TextField
          label="Author Email"
          id="authorEmail"
          name="authorEmail"
          value={authorEmail}
          fullWidth
          margin="normal"
          onChange={(e) => setAuthorEmail(e.target.value)}
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

export default RecipeEditor;
