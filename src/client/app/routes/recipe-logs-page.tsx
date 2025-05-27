import { useClient, type IRecipe, type IRecipeLog } from "~/server";
import { useNavigate, useParams } from "react-router";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAsync, useLocalStorage } from "~/utils";
import { useState } from "react";

export const RecipeLogs = (props: { recipeId: string }) => {
  const client = useClient();
  const historyState = useAsync(() => client.getRecipeLogs(props.recipeId));

  if (historyState.loading) {
    return <Typography>Loading...</Typography>;
  }
  if (historyState.error) {
    return (
      <Typography color="error">Error: {historyState.error.message}</Typography>
    );
  }

  const history = historyState.data!;
  return (
    <Grid container sx={{ mt: 3, p: 0 }}>
      {history.map((entry, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={entry.id}>
          <Card>
            <CardContent>
              <Typography gutterBottom variant="h6" component="div">
                By {entry.commit?.author.name}{" "}
                {entry.commit?.author.when && new Date(entry.commit?.author.when).toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {entry.description}
                <List>
                  {entry.actualIngredients?.map((ingredient, idx) => (
                    <ListItem>
                      <ListItemText
                        primary={`${ingredient.name} ${ingredient.quantity} ${ingredient.unit}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

const RecipeLogEditor = (props: { recipe: IRecipeLog | undefined }) => {
  const orignalId = props.recipe?.id;

  const [form, setForm] = useState<IRecipeLog>(
    props.recipe ?? ({} as IRecipeLog)
  );
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
        `Changed log ${id} in recipe ${props.recipe?.recipeId}`,
        authorName!,
        authorEmail!
      );
      navigate(`/recipes/${result.id}/logs`);
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

const RecipeLogsPage = () => {
  const client = useClient();
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
    <Stack spacing={2} sx={{ padding: 2 }}>
      <Typography variant="h5" sx={{ mt: 2 }}>
        Logs for {recipe.title}
      </Typography>
      <RecipeLogs recipeId={recipe.id} />
      <Typography variant="h5" sx={{ mt: 2 }}>
        Add Log
      </Typography>
      <Paper sx={{ padding: 2 }}>
        <RecipeLogEditor recipe={{ recipeId: recipe.id } as IRecipeLog} />
      </Paper>
    </Stack>
  );
};

export default RecipeLogsPage;
