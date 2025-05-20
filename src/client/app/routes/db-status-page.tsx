import { Button, Paper, Stack } from "@mui/material";
import type { Route } from "./+types/db-status-page";
import { useClient } from "~/server";
import { useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RT - Add Recipe" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

const DbStatusPage = () => {
  const client = useClient();

  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  function handleCommand(cmd: () => Promise<any>) {
    setLoading(true);
    setError(null);
    cmd()
      .then(() => {
        alert("Push successful");
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <Stack
      sx={{ width: "100%", maxWidth: 1000, mx: "auto", padding: 2 }}
      spacing={2}
    >
      <h2>Control</h2>
      <Stack direction={"row"} spacing={2}>
        <Button
          variant="contained"
          onClick={() => handleCommand(client.dbPush)}
        >
          Push
        </Button>
        <Button
          variant="contained"
          onClick={() => handleCommand(client.dbPull)}
        >
          Pull
        </Button>
      </Stack>
      {error && (
        <Paper
          sx={{ padding: 2, backgroundColor: "error.main", color: "white" }}
        >
          <h3>Error</h3>
          <p>{error.message}</p>
        </Paper>
      )}
      {loading && (
        <Paper
          sx={{ padding: 2, backgroundColor: "info.main", color: "white" }}
        >
          <h3>Loading...</h3>
          <p>Please wait</p>
        </Paper>
      )}
    </Stack>
  );
};

export default DbStatusPage;
