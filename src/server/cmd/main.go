package main

import (
	"encoding/json"
	"net/http"
	"net/http/httputil"
	"os"

	"log/slog"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/httplog/v2"
	"github.com/jonasmh/recipetracker/pkg/config"
	"github.com/jonasmh/recipetracker/pkg/database"
	"github.com/jonasmh/recipetracker/pkg/models"
)

var cfg *config.Config
var db *database.RecipeDatabase

func mustLoadConfig() *config.Config {
	configFile := os.Getenv("CONFIG_FILE")
	if configFile == "" {
		configFile = "config.yaml"
	}

	slog.Info("Loading config file", "file", configFile)

	cfg, err := config.LoadConfig(configFile)
	if err != nil {
		slog.Error("Failed to load config", "err", err)
		os.Exit(1)
	}
	return cfg
}

func main() {
	cfg = mustLoadConfig()
	db = database.NewRecipeDatabase(cfg.Git.Repository)

	logger := httplog.NewLogger("httplog-example", httplog.Options{
		// JSON:             true,
		LogLevel:         slog.LevelWarn,
		Concise:          true,
		JSON:             false,
		MessageFieldName: "message",
		RequestHeaders:   false,
		ResponseHeaders:  false,
	})

	r := chi.NewRouter()

	r.Use(httplog.RequestLogger(logger))
	r.Get("/api/recipes", listRecipesHandler)
	r.Post("/api/recipes", newRecipeHandler)
	r.Get("/api/recipes/{id}", recipeHandler)
	r.Get("/api/recipes/{id}/history", recipeHistoryHandler)

	if cfg.Frontend.EnableProxy {
		slog.Info("Proxying requests to frontend dev server at", "endpoint", "http://localhost:3000")
		// Proxy all non-/api requests to another host (e.g., frontend dev server)
		r.NotFound(proxyToHost("http://localhost:3000"))
	} else {
		slog.Info("Serving static files from", "path", "public")
		r.Handle("/*", http.StripPrefix("/", http.FileServer(http.Dir("public"))))
	}

	slog.Info("Server started at", "port", cfg.Server.Port)

	err := http.ListenAndServe(":"+cfg.Server.Port, r)
	if err != nil {
		slog.Error("Failed to start server", "error", err)
		os.Exit(1)
	}

}

// proxyToHost returns an http.HandlerFunc that proxies requests to the given host
func proxyToHost(target string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		proxy := &httputil.ReverseProxy{
			Director: func(req *http.Request) {
				req.URL.Scheme = "http"
				req.URL.Host = "localhost:5173"
				req.URL.Path = r.URL.Path
				req.URL.RawQuery = r.URL.RawQuery
				req.Header = r.Header
			},
		}
		proxy.ServeHTTP(w, r)
	}
}

func listRecipesHandler(w http.ResponseWriter, r *http.Request) {
	recipes, err := db.GetRecipes()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(recipes); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func recipeHandler(w http.ResponseWriter, r *http.Request) {
	recipe, err := db.GetRecipe(r.PathValue("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(recipe); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func recipeHistoryHandler(w http.ResponseWriter, r *http.Request) {
	recipe, err := db.GetRecipeHistory(r.PathValue("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(recipe); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func newRecipeHandler(w http.ResponseWriter, r *http.Request) {
	var recipe models.Recipe
	if err := json.NewDecoder(r.Body).Decode(&recipe); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	err := db.AddOrUpdateRecipe(recipe, r.URL.Query().Get("commitMessage"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(recipe); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
