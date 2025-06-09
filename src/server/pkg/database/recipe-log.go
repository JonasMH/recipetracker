package database

import (
	"encoding/json"
	"os"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/jonasmh/recipetracker/pkg/models"
)

func (db *RecipeDatabase) AddRecipeLog(rlog models.RecipeLog, commitMessage, authourName, authorEmail string) error {
	repo, err := git.PlainOpen(db.root)
	if err != nil {
		return err
	}

	worktree, err := repo.Worktree()
	if err != nil {
		return err
	}

	filePath := recipesPath + rlog.RecipeId + "/logs/" + rlog.Id + ".json"
	if _, err := worktree.Filesystem.Stat(recipesPath + rlog.Id); os.IsNotExist(err) {
		if err := worktree.Filesystem.MkdirAll(recipesPath+rlog.Id, 0755); err != nil {
			return err
		}
	}

	file, err := worktree.Filesystem.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	rlog.Commit = nil // Reset commit to nil, as it will be set by the git commit
	encoder := json.NewEncoder(file)
	if err := encoder.Encode(rlog); err != nil {
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

func (db *RecipeDatabase) GetRecipeLog(recipeId string, logId string) (*models.RecipeLog, error) {
	repo, err := git.PlainOpen(db.root)
	if err != nil {
		return nil, err
	}

	worktree, err := repo.Worktree()
	if err != nil {
		return nil, err
	}

	recipeLogFileName := recipesPath + recipeId + "/logs/" + logId + ".json"
	f, err := worktree.Filesystem.Open(recipeLogFileName)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var rlog models.RecipeLog
	if err := json.NewDecoder(f).Decode(&rlog); err != nil {
		return nil, err
	}
	rlog.Id = logId
	// Get the commit of when this file was last changed
	logIter, err := repo.Log(&git.LogOptions{FileName: &recipeLogFileName})
	if err == nil {
		defer logIter.Close()
		commit, err := logIter.Next()
		if err == nil && commit != nil {
			commitModel := convertToCommitModel(commit)
			rlog.Commit = &commitModel
		}
	}

	return &rlog, nil
}

func (db *RecipeDatabase) GetRecipeLogs(recipeId string) ([]models.RecipeLog, error) {
	repo, err := git.PlainOpen(db.root)
	if err != nil {
		return nil, err
	}

	worktree, err := repo.Worktree()
	if err != nil {
		return nil, err
	}
	rlogs := make([]models.RecipeLog, 0)

	recipeLogsPath := recipesPath + recipeId + "/logs/"

	dirInfo, err := worktree.Filesystem.ReadDir(recipeLogsPath)
	if err != nil {
		if os.IsNotExist(err) {
			return rlogs, nil
		}

		return nil, err
	}

	for _, logFile := range dirInfo {
		if logFile.IsDir() {
			continue
		}
		recipeLogFileName := recipeLogsPath + logFile.Name()
		f, err := worktree.Filesystem.Open(recipeLogFileName)
		if err != nil {
			return nil, err
		}
		defer f.Close()

		var rlog models.RecipeLog
		if err := json.NewDecoder(f).Decode(&rlog); err != nil {
			return nil, err
		}
		rlog.Id = logFile.Name()[:len(logFile.Name())-len(".json")]
		// Get the commit of when this file was last changed
		logIter, err := repo.Log(&git.LogOptions{FileName: &recipeLogFileName})
		if err == nil {
			defer logIter.Close()
			commit, err := logIter.Next()
			if err == nil && commit != nil {
				commitModel := convertToCommitModel(commit)
				rlog.Commit = &commitModel
			}
		}

		rlogs = append(rlogs, rlog)
	}

	return rlogs, nil
}
