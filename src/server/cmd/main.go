package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"net/url"
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
	r.Get("/recipes", listRecipesHandler)
	r.Post("/recipes", newRecipeHandler)
	r.Get("/recipes/{id}", recipeHandler)
	r.Get("/recipes/{id}/edit", recipeEditHandler)
	r.Post("/recipes/{id}", newRecipeHandler)

	log.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}

func listRecipesHandler(w http.ResponseWriter, r *http.Request) {
	recipes, err := db.GetRecipes()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html;charset=UTF-8")
	if err := pages.RecipesPage(recipes).Render(context.Background(), w); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func recipeHandler(w http.ResponseWriter, r *http.Request) {
	recipe, err := db.GetRecipe(r.PathValue("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html;charset=UTF-8")
	if err := pages.RecipePage(recipe, db).Render(context.Background(), w); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func recipeEditHandler(w http.ResponseWriter, r *http.Request) {
	recipe, err := db.GetRecipe(r.PathValue("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html;charset=UTF-8")
	if err := pages.RecipeEditPage(recipe).Render(context.Background(), w); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func newRecipeHandler(w http.ResponseWriter, r *http.Request) {
	var id = r.PathValue("id")

	if id == "" { // New recipe
		idFromForm := r.FormValue("id")
		_, err := db.GetRecipe(idFromForm)
		if err == nil {
			http.Error(w, "Recipe already exists", http.StatusBadRequest)
			return
		}
	}

	var recipe models.Recipe
	if err := r.ParseForm(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	recipe.Id = id
	recipe.Title, _ = url.QueryUnescape(r.FormValue("title"))
	recipe.Description, _ = url.QueryUnescape(r.FormValue("description"))
	recipe.Ingredients = make([]models.RecipeIngredient, 0)

	i := 0
	for {
		nameBefore := r.FormValue("ingredients[" + strconv.Itoa(i) + "].name")
		name, _ := url.QueryUnescape(r.FormValue("ingredients[" + strconv.Itoa(i) + "].name"))
		if name == "" {
			break
		}
		slog.Info("nameBefore", "nameBefore", nameBefore)

		quantity, _ := url.QueryUnescape(r.FormValue("ingredients[" + strconv.Itoa(i) + "].quantity"))
		unit, _ := url.QueryUnescape(r.FormValue("ingredients[" + strconv.Itoa(i) + "].unit"))

		ingredient := models.RecipeIngredient{
			Name:     name,
			Quantity: quantity,
			Unit:     unit,
		}
		recipe.Ingredients = append(recipe.Ingredients, ingredient)

		i++
	}

	err := db.AddOrUpdateRecipe(recipe, r.FormValue("commitMessage"))

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	http.Redirect(w, r, "/recipes/"+recipe.Id, http.StatusSeeOther)
}
