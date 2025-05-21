import { Box, Typography } from "@mui/material";

export function AboutPage() {
  return (
    <Box sx={{ m: 2 }}>
      <Typography variant="h4" fontWeight="bold">About</Typography>
      <p>
        This is a simple recipe management application. It allows users to create, edit, and view recipes while using a Git repository for storage.
      </p>

      <p>
        Source: <a href="https://github.com/jonasmh/recipetracker" target="_blank">GitHub.com</a>
      </p>

      <Typography variant="h5" fontWeight="bold">Credits / Attributions</Typography>
      <ul>
        <li><a href="https://www.flaticon.com/free-icons/chef" title="chef icons">Chef icons created by Those Icons - Flaticon</a></li>
      </ul>
    </Box>
  );
}


export default AboutPage;