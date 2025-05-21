import { Stack, Fab, Link } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RecipesList from "~/components/recipes-list";

export default function Home() {
  return (
    <>
      <RecipesList />
      <Fab
        color="primary"
        aria-label="add"
        component={Link}
        href="/new-recipe"
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>
    </>
  );
}
