import React from "react";
import { useServer, type IRecipe } from "~/server";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router";

const RecipeEditor = (props: { recipe: IRecipe | undefined }) => {
  const orignalId = props.recipe?.id;

  const [form, setForm] = React.useState<IRecipe>(
    props.recipe ?? ({} as IRecipe)
  );
  const [commitMessage, setCommitMessage] = React.useState<string>("");
  const client = useServer();
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    console.log(form);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const result = await client.editRecipe(form, commitMessage);
      navigate(`/recipes/${result.id}`);
    } catch (err) {
      // Optionally handle error
      alert("Failed to save recipe");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField
        label="Id"
        id="id"
        name="id"
        value={form.id ?? ""}
        required
        disabled={!!orignalId}
        fullWidth
        margin="normal"
        onChange={handleChange}
      />
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
                updated[idx] = { ...updated[idx], quantity: e.target.value };
                setForm({ ...form, ingredients: updated });
              }}
              size="small"
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
                { name: "", quantity: "", unit: "" },
              ],
            });
          }}
        >
          Add Ingredient
        </Button>
      </Box>
      <TextField
        label="Commit Message"
        id="commitMessage"
        name="commitMessage"
        value={commitMessage}
        fullWidth
        margin="normal"
        onChange={(e) => setCommitMessage(e.target.value)}
      ></TextField>
      <Button
        type="submit"
        variant="contained"
        color="primary"
        sx={{ mt: 2, alignSelf: "flex-start" }}
      >
        Save
      </Button>
    </Box>
  );
};

export default RecipeEditor;
