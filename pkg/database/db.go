package database

import (
	"encoding/json"
	"log"
	"os"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/jonasmh/recipetracker/pkg/models"
)

type RecipeDatabase struct {
	root string
}

const (
	recipesPath = "recipes/"
)

func NewRecipeDatabase(dbLocation string) *RecipeDatabase {
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

	return &RecipeDatabase{
		root: dbLocation,
	}
}

func (db *RecipeDatabase) GetRecipeHistory(name string) (history []*object.Commit, err error) {
	repo, err := git.PlainOpen(db.root)
	if err != nil {
		return nil, err
	}

	filePath := recipesPath + name + "/current.json"
	logIter, err := repo.Log(&git.LogOptions{FileName: &filePath})
	if err != nil {
		return nil, err
	}

	defer logIter.Close()
	for {
		commit, err := logIter.Next()
		if err != nil {
			if err.Error() == "EOF" {
				break
			}
			return nil, err
		}
		history = append(history, commit)
	}

	return history, nil
}

func (db *RecipeDatabase) GetRecipe(name string) (model models.Recipe, err error) {
	repo, err := git.PlainOpen(db.root)
	if err != nil {
		return model, err
	}

	worktree, err := repo.Worktree()
	if err != nil {
		return model, err
	}

	filePath := recipesPath + name + "/current.json"
	file, err := worktree.Filesystem.Open(filePath)
	if err != nil {
		return model, err
	}
	defer file.Close()

	if err := json.NewDecoder(file).Decode(&model); err != nil {
		return model, err
	}

	return model, nil
}

func (db *RecipeDatabase) GetRecipes() ([]models.Recipe, error) {
	repo, err := git.PlainOpen(db.root)
	if err != nil {
		return nil, err
	}

	worktree, err := repo.Worktree()
	if err != nil {
		return nil, err
	}

	dirInfo, err := worktree.Filesystem.ReadDir(recipesPath)
	if err != nil {
		return nil, err
	}

	recipes := make([]models.Recipe, 0)
	for _, dir := range dirInfo {
		if !dir.IsDir() {
			continue
		}

		filePath := recipesPath + dir.Name() + "/current.json"
		f, err := worktree.Filesystem.Open(filePath)
		if err != nil {
			return nil, err
		}
		defer f.Close()

		var recipe models.Recipe
		if err := json.NewDecoder(f).Decode(&recipe); err != nil {
			return nil, err
		}

		fileName := dir.Name()
		recipe.Id = fileName[:len(fileName)-len("/current.json")]

		recipes = append(recipes, recipe)
	}

	return recipes, nil
}

func (db *RecipeDatabase) AddOrUpdateRecipe(recipe models.Recipe) error {
	repo, err := git.PlainOpen(db.root)
	if err != nil {
		return err
	}

	worktree, err := repo.Worktree()
	if err != nil {
		return err
	}

	filePath := recipesPath + recipe.Id + "/current.json"
	if _, err := worktree.Filesystem.Stat(recipesPath + recipe.Id); os.IsNotExist(err) {
		if err := os.Mkdir(recipesPath+recipe.Id, 0755); err != nil {
			return err
		}
	}

	file, err := worktree.Filesystem.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	if err := json.NewEncoder(file).Encode(recipe); err != nil {
		return err
	}

	if _, err := worktree.Add(filePath); err != nil {
		return err
	}

	if _, err := worktree.Commit("Add or update recipe: "+recipe.Id, &git.CommitOptions{}); err != nil {
		return err
	}

	return nil
}
