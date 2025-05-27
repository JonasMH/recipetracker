package database

import (
	"errors"
	"os"

	"log/slog"

	"github.com/go-git/go-git/v5"
	gitconfig "github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing/transport/ssh"
	"github.com/jonasmh/recipetracker/pkg/config"
)

type RecipeDatabase struct {
	root       string
	remote     string
	sshKeyPath string
}

func New(config config.GitConfig) (*RecipeDatabase, error) {

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
