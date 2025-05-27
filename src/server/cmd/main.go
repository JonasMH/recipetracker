package main

import (
	"os"

	"log/slog"

	"github.com/jonasmh/recipetracker/pkg/config"
	"github.com/jonasmh/recipetracker/pkg/database"
	"github.com/jonasmh/recipetracker/pkg/webserver"
)

var cfg *config.Config
var db *database.RecipeDatabase

func mustLoadConfig() *config.Config {
	configFile := os.Getenv("CONFIG_FILE")
	if configFile == "" {
		configFile = "config.yaml"
	}

	slog.Info("Loading config file", "file", configFile)

	cfg, err := config.LoadConfig(configFile)
	if err != nil {
		slog.Error("Failed to load config", "err", err)
		os.Exit(1)
	}
	return cfg
}

func main() {
	cfg = mustLoadConfig()
	database, err := database.New(cfg.Git)
	if err != nil {
		slog.Error("Failed to initialize database", "err", err)
		os.Exit(1)
	}
	db = database

	webserver := webserver.New(cfg, db)

	err = webserver.ListenAndServe()

	if err != nil {
		slog.Error("Failed to start web server", "err", err)
		os.Exit(1)
	}
}
