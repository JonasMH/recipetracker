package main

import (
	"encoding/json"
	"log"
	"net/http"
	"net/http/httputil"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jonasmh/recipetracker/pkg/database"
	"github.com/jonasmh/recipetracker/pkg/models"
)

const (
	dbLocation  = "db/"
	recipesPath = "recipes/"
)

var db *database.RecipeDatabase

func main() {
	db = database.NewRecipeDatabase(dbLocation)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Get("/api/recipes", listRecipesHandler)
	r.Post("/api/recipes", newRecipeHandler)
	r.Get("/api/recipes/{id}", recipeHandler)
	r.Get("/api/recipes/{id}/history", recipeHistoryHandler)

	// Proxy all non-/api requests to another host (e.g., frontend dev server)
	r.NotFound(proxyToHost("http://localhost:3000"))

	log.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
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
