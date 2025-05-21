package database

import (
	"encoding/json"
	"errors"
	"os"
	"time"

	"log/slog"

	"github.com/go-git/go-git/v5"
	gitconfig "github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/go-git/go-git/v5/plumbing/transport/ssh"
	"github.com/jonasmh/recipetracker/pkg/config"
	"github.com/jonasmh/recipetracker/pkg/models"
)

type RecipeDatabase struct {
	root       string
	remote     string
	sshKeyPath string
}

const (
	recipesPath = "recipes/"
)

func NewRecipeDatabase(config config.GitConfig) (*RecipeDatabase, error) {

	if _, err := os.Stat(config.Repository); os.IsNotExist(err) {
		if err := os.Mkdir(config.Repository, 0755); err != nil {
			return nil, errors.Join(err, errors.New("failed to create db directory"))
		}
		_, err := git.PlainInit(config.Repository, false)
		if err != nil {
			return nil, errors.Join(err, errors.New("failed to initialize git repository"))
		}
		slog.Info("Created git repository", "path", config.Repository)
	} else {
		slog.Info("Opening git repository", "path", config.Repository)
		_, err := git.PlainInit(config.Repository, false)
		if err != nil && !errors.Is(err, git.ErrRepositoryAlreadyExists) {
			return nil, errors.Join(err, errors.New("failed to open git repository"))
		}
	}

	if config.Remote != "" {
		repo, err := git.PlainOpen(config.Repository)
		if err != nil {
			return nil, errors.Join(err, errors.New("failed to open git repository for remote setup"))
		}
		_, err = repo.CreateRemote(&gitconfig.RemoteConfig{
			Name: "origin",
			URLs: []string{config.Remote},
		})
		if err != nil {
			if errors.Is(err, git.ErrRemoteExists) {
				cfg, err := repo.Config()
				if err != nil {
					return nil, errors.Join(err, errors.New("failed to get git config"))
				}

				cfg.Remotes["origin"].URLs = []string{config.Remote}
				if err := repo.Storer.SetConfig(cfg); err != nil {
					return nil, errors.Join(err, errors.New("failed to update origin remote URL"))
				}
				slog.Info("Updated remote origin URL", "url", config.Remote)
			} else {
				return nil, errors.Join(err, errors.New("failed to create origin remote"))
			}
		} else {
			slog.Info("Created remote origin", "url", config.Remote)
		}
	}

	return &RecipeDatabase{
		root:       config.Repository,
		remote:     config.Remote,
		sshKeyPath: config.SshKeyPath,
	}, nil
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

func (db *RecipeDatabase) Push() error {
	repo, err := git.PlainOpen(db.root)
	if err != nil {
		return err
	}

	sshKey, err := db.loadSshkey()
	if err != nil {
		return err
	}

	slog.Info("Pushing to remote", "remote", db.remote)

	if err := repo.Push(&git.PushOptions{
		Auth: sshKey,
	}); err != nil {
		return err
	}

	return nil
}

func (db *RecipeDatabase) Pull() error {
	repo, err := git.PlainOpen(db.root)
	if err != nil {
		return err
	}
	worktree, err := repo.Worktree()
	if err != nil {
		return err
	}

	sshKey, err := db.loadSshkey()
	if err != nil {
		return err
	}

	slog.Info("Pulling from remote", "remote", db.remote)

	err = worktree.Pull(&git.PullOptions{
		Auth: sshKey,
	})
	if err != nil && err != git.NoErrAlreadyUpToDate {
		return err
	}

	return nil
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

func (db *RecipeDatabase) loadSshkey() (*ssh.PublicKeys, error) {
	if db.sshKeyPath == "" {
		slog.Info("SSH key path not set, not auth")
		return nil, nil
	}
	publicKey, err := ssh.NewPublicKeysFromFile("git", db.sshKeyPath, "")

	if err != nil {
		return nil, err
	}

	slog.Info("Loaded SSH key", "path", db.sshKeyPath)
	return publicKey, nil
}
