package main

import (
	"context"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
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

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Get("/", listRecipesHandler)
	r.Get("/recipes/{name}", recipeHandler)
	r.Post("/recipes/", newRecipeHandler)

	log.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}

func listRecipesHandler(w http.ResponseWriter, r *http.Request) {
	recipes, err := db.GetRecipes()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html")
	if err := pages.RecipesPage(recipes).Render(context.Background(), w); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
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
	var recipe models.Recipe
	if err := r.ParseForm(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	recipe.Id = r.FormValue("id")
	recipe.Title = r.FormValue("title")
	recipe.Description = r.FormValue("description")
	recipe.Ingredients = make([]models.RecipeIngredient, 0)

	i := 0
	for {
		if r.FormValue("ingredients["+strconv.Itoa(i)+"].name") == "" {
			break
		}

		ingredient := models.RecipeIngredient{
			Name:     r.FormValue("ingredients[" + strconv.Itoa(i) + "].name"),
			Quantity: r.FormValue("ingredients[" + strconv.Itoa(i) + "].quantity"),
			Unit:     r.FormValue("ingredients[" + strconv.Itoa(i) + "].unit"),
		}
		recipe.Ingredients = append(recipe.Ingredients, ingredient)

		i++
	}

	err := db.AddOrUpdateRecipe(recipe)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := pages.RecipePage(recipe, db).Render(context.Background(), w); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
