package database

import (
	"encoding/json"
	"os"

	"log/slog"

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
			slog.Error("Failed to create db directory", "err", err, "path", dbLocation)
			os.Exit(1)
		}
		_, err := git.PlainInit(dbLocation, false)
		if err != nil {
			slog.Error("Failed to initialize git repository", "err", err)
			os.Exit(1)
		}
		slog.Info("Database directory created and git initialized.")
	}

	return &RecipeDatabase{
		root: dbLocation,
	}
}

func (db *RecipeDatabase) GetRecipeHistory(id string) (history []*object.Commit, err error) {
	repo, err := git.PlainOpen(db.root)
	if err != nil {
		return nil, err
	}

	filePath := recipesPath + id + "/current.json"
	logIter, err := repo.Log(&git.LogOptions{FileName: &filePath})
	if err != nil {
		if os.IsNotExist(err) {
			return make([]*object.Commit, 0), nil
		}

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
	model.Id = name

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
	recipes := make([]models.Recipe, 0)

	dirInfo, err := worktree.Filesystem.ReadDir(recipesPath)
	if err != nil {
		if os.IsNotExist(err) {
			return recipes, nil
		}

		return nil, err
	}

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
		recipe.Id = dir.Name()

		recipes = append(recipes, recipe)
	}

	return recipes, nil
}

func (db *RecipeDatabase) AddOrUpdateRecipe(recipe models.Recipe, commitMessage string) error {
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
		if err := worktree.Filesystem.MkdirAll(recipesPath+recipe.Id, 0755); err != nil {
			return err
		}
	}

	file, err := worktree.Filesystem.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	if err := encoder.Encode(recipe); err != nil {
		return err
	}

	if _, err := worktree.Add(filePath); err != nil {
		return err
	}

	if _, err := worktree.Commit(commitMessage, &git.CommitOptions{}); err != nil {
		return err
	}

	return nil
}
