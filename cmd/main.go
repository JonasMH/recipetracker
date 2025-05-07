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
	"github.com/jonasmh/recipetracker/pkg/models"
	"github.com/jonasmh/recipetracker/pkg/pages"
)

const (
	dbLocation  = "db/"
	recipesPath = "recipes/"
)

func main() {
	if _, err := os.Stat(dbLocation); os.IsNotExist(err) {
		if err := os.Mkdir(dbLocation, 0755); err != nil {
			log.Fatalf("Failed to create db directory: %v", err)
		}
		_, err := git.PlainInit(dbLocation, false)
		if err != nil {
			log.Fatalf("Failed to initialize git repository: %v", err)
		}
		log.Println("Database directory created and git initialized.")
	}

	http.HandleFunc("/", recipesHandler)
	http.HandleFunc("/recipe/{name}", recipeHandler)
	http.HandleFunc("/new-recipe", newRecipeHandler)

	log.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func recipesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		files, err := os.ReadDir(dbLocation + recipesPath)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		var recipes []models.Recipe
		for _, file := range files {
			if file.IsDir() {
				continue
			}
			f, err := os.Open(dbLocation + recipesPath + file.Name())
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			defer f.Close()
			var recipe models.Recipe
			if err := json.NewDecoder(f).Decode(&recipe); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			recipes = append(recipes, recipe)
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
		var recipe models.Recipe
		f, err := os.Open(dbLocation + recipesPath + r.PathValue("name") + ".json")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer f.Close()
		if err := json.NewDecoder(f).Decode(&recipe); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/html")
		if err := pages.RecipePage(recipe).Render(context.Background(), w); err != nil {
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
