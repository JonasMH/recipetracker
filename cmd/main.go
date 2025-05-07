package main

import (
	"html/template"
	"net/http"
	"log"
	"os"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
)

type Recipe struct {
	ID    string
	Title string
	Notes []string
}

var templates = template.Must(template.ParseGlob("templates/*.html"))

const (
	dbLocation = "db/"
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

	http.HandleFunc("/", listRecipes)
	http.HandleFunc("/recipe/new", newRecipe)
	http.HandleFunc("/recipe/edit", editRecipe)
	http.HandleFunc("/recipe/note", addNote)

	log.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func listRecipes(w http.ResponseWriter, r *http.Request) {
	templates.ExecuteTemplate(w, "list.html", nil)
}

func newRecipe(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		repo, err := git.PlainOpen(dbLocation)
		if err != nil {
			log.Fatalf("Failed to open git repository: %v", err)
		}
		worktree, err := repo.Worktree()
		if err != nil {
			log.Fatalf("Failed to get worktree: %v", err)
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
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}
	templates.ExecuteTemplate(w, "new.html", nil)
}

func editRecipe(w http.ResponseWriter, r *http.Request) {
	// Logic to edit a recipe
}

func addNote(w http.ResponseWriter, r *http.Request) {
	// Logic to add a note to a recipe
}