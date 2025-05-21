import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { ThemeProvider, CssBaseline, createTheme, Link } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import {
  Link as RouterLink,
  type LinkProps as RouterLinkProps,
} from "react-router";
import type { LinkProps } from "@mui/material/Link";
import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { forwardRef, useState } from "react";
// import "./app.css";

const LinkBehavior = forwardRef<
  HTMLAnchorElement,
  Omit<RouterLinkProps, "to"> & { href: RouterLinkProps["to"] }
>((props, ref) => {
  const { href, ...other } = props;
  // Map href (Material UI) -> to (react-router)
  return <RouterLink ref={ref} to={href} {...other} />;
});

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = createTheme({
    components: {
      MuiLink: {
        defaultProps: {
          component: LinkBehavior,
        } as LinkProps,
      },
      MuiButtonBase: {
        defaultProps: {
          LinkComponent: LinkBehavior,
        },
      },
    },
  });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <html lang="en" style={{height: "100%"}}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Recipe Tracker</title>
        <Links />
      </head>
      <body style={{height: "100%"}}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppBar position="static">
            <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
              <Link href="/">
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", letterSpacing: 1, color: "white" }}
                >
                  Recipe Tracker
                </Typography>
              </Link>
              {/* Responsive navigation */}
              <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
                <Stack direction="row" spacing={2}>
                  <Link href="/" sx={{ color: "white", textDecoration: "none" }}>
                    Recipes
                  </Link>
                  <Link href="/new-recipe" sx={{ color: "white", textDecoration: "none" }}>
                    Add Recipe
                  </Link>
                  <Link href="/db-status" sx={{ color: "white", textDecoration: "none" }}>
                    DB Status
                  </Link>
                  <Link href="/about" sx={{ color: "white", textDecoration: "none" }}>
                    About
                  </Link>
                </Stack>
              </Box>
              {/* Hamburger menu for mobile */}
              <Box sx={{ display: { xs: "flex", md: "none" } }}>
                <IconButton
                  size="large"
                  edge="end"
                  color="inherit"
                  aria-label="menu"
                  onClick={handleMenuOpen}
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                >
                  <MenuItem component={Link} href="/db-status" onClick={handleMenuClose}>
                    DB Status
                  </MenuItem>
                  <MenuItem component={Link} href="/about" onClick={handleMenuClose}>
                    About
                  </MenuItem>
                </Menu>
              </Box>
            </Toolbar>
          </AppBar>
          <Container maxWidth="md" disableGutters style={{height: "calc(100vh - 64px)"}}>
            <Box sx={{ minHeight: "70vh", height: "100%" }}>{/* Responsive main content */}
              <Outlet />
            </Box>
          </Container>
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default Layout;