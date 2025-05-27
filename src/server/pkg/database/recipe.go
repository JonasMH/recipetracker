package database

import (
	"encoding/json"
	"os"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/jonasmh/recipetracker/pkg/models"
)

const (
	recipesPath = "recipes/"
)

func convertToCommitModel(commit *object.Commit) models.Commit {
	return models.Commit{
		Hash: commit.Hash.String(),
		Author: models.CommitAuthor{
			Name:  commit.Author.Name,
			Email: commit.Author.Email,
			When:  commit.Author.When.Format(time.RFC3339),
		},
		Committer: models.CommitAuthor{
			Name:  commit.Committer.Name,
			Email: commit.Committer.Email,
			When:  commit.Committer.When.Format(time.RFC3339),
		},
		Message: commit.Message,
	}
}

func (db *RecipeDatabase) GetRecipeHistory(id string) (history []models.Commit, err error) {
	repo, err := git.PlainOpen(db.root)
	if err != nil {
		return nil, err
	}

	filePath := recipesPath + id + "/current.json"
	logIter, err := repo.Log(&git.LogOptions{FileName: &filePath})
	if err != nil {
		if os.IsNotExist(err) {
			return make([]models.Commit, 0), nil
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
		history = append(history, convertToCommitModel(commit))
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
			if os.IsNotExist(err) {
				continue // Skip if the current.json file does not exist
			}

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

func (db *RecipeDatabase) AddOrUpdateRecipe(recipe models.Recipe, commitMessage, authourName, authorEmail string) error {
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

	if _, err := worktree.Commit(commitMessage, &git.CommitOptions{
		Author: &object.Signature{
			Name:  authourName,
			Email: authorEmail,
			When:  time.Now(),
		},
	}); err != nil {
		return err
	}

	return nil
}
