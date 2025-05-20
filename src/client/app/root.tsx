import {
  isRouteErrorResponse,
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

import type { Route } from "./+types/root";
import { forwardRef } from "react";
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
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
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
              <nav>
                <Link href="/" sx={{ color: "white", textDecoration: "none" }}>
                  Recipes
                </Link>
                <Link
                  href="/new-recipe"
                  sx={{ color: "white", textDecoration: "none", ml: 2 }}
                >
                  Add Recipe
                </Link>
                <Link
                  href="/db-status"
                  sx={{ color: "white", textDecoration: "none", ml: 2 }}
                >
                  DB Status
                </Link>
              </nav>
            </Toolbar>
          </AppBar>
          {children}
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
