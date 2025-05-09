package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/jonasmh/recipetracker/pkg/database"
	"github.com/jonasmh/recipetracker/pkg/models"
	"github.com/jonasmh/recipetracker/pkg/pages"
)

const (
	dbLocation  = "db/"
	recipesPath = "recipes/"
)

var db *database.RecipeDatabase

func main() {
	db = database.NewRecipeDatabase(dbLocation)

	routes := map[string]http.HandlerFunc{
		"/": func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path != "/" {
				http.NotFound(w, r)
				return
			}
			recipesHandler(w, r)
		},
		"/recipe/{name}": recipeHandler,
		"/new-recipe": newRecipeHandler,
	}

	mux := http.NewServeMux()
	for path, handler := range routes {
		mux.HandleFunc(path, handler)
	}

	log.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}

func recipesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		recipes, err := db.GetRecipes()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/html")
		if err := pages.RecipesPage(recipes).Render(context.Background(), w); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		return
	}
	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func recipeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		recipe, err := db.GetRecipe(r.PathValue("name"))
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/html")
		if err := pages.RecipePage(recipe, db).Render(context.Background(), w); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		return
	}
	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func newRecipeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		addRecipe(w, r)
		return // Only handle POST requests
	}
	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func addRecipe(w http.ResponseWriter, r *http.Request) {
	repo, err := git.PlainOpen(dbLocation)
	if err != nil {
		log.Fatalf("Failed to open git repository: %v", err)
	}

	worktree, err := repo.Worktree()
	if err != nil {
		log.Fatalf("Failed to get worktree: %v", err)
	}

	var recipe models.Recipe
	if err := json.NewDecoder(r.Body).Decode(&recipe); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	file, err := os.Create(dbLocation + recipesPath + recipe.Title + ".json")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer file.Close()
	if err := json.NewEncoder(file).Encode(recipe); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if _, err := worktree.Add("."); err != nil {
		log.Fatalf("Failed to add changes: %v", err)
	}
	if _, err := worktree.Commit("Add new recipe", &git.CommitOptions{
		Author: &object.Signature{
			Name:  "Recipe Tracker",
			Email: "noreply@recipetracker.com",
			When:  time.Now(),
		},
	}); err != nil {
		log.Fatalf("Failed to commit changes: %v", err)
	}
}
