package webserver

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httputil"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/httplog/v2"
	"github.com/jonasmh/recipetracker/pkg/config"
	"github.com/jonasmh/recipetracker/pkg/database"
	"github.com/jonasmh/recipetracker/pkg/models"
)

type WebServer struct {
	r    *chi.Mux
	db   *database.RecipeDatabase
	Port string
}

func New(cfg *config.Config, db *database.RecipeDatabase) *WebServer {
	logger := httplog.NewLogger("httplog-example", httplog.Options{
		// JSON:             true,
		LogLevel:         slog.LevelWarn,
		Concise:          true,
		JSON:             false,
		MessageFieldName: "message",
		RequestHeaders:   false,
		ResponseHeaders:  false,
	})

	server := WebServer{
		r:    chi.NewRouter(),
		Port: cfg.Server.Port,
		db:   db,
	}

	server.r.Use(httplog.RequestLogger(logger))
	server.r.Post("/api/db/push", server.dbPushHandler)
	server.r.Post("/api/db/pull", server.dbPullHandler)
	server.r.Get("/api/recipes", server.listRecipesHandler)
	server.r.Post("/api/recipes", server.newRecipeHandler)
	server.r.Get("/api/recipes/{recipeId}", server.recipeHandler)
	server.r.Get("/api/recipes/{recipeId}/history", server.recipeHistoryHandler)
	server.r.Get("/api/recipes/{recipeId}/logs", server.recipeLogsHandler)
	server.r.Post("/api/recipes/{recipeId}/logs", server.newRecipeLogHandler)
	server.r.Get("/api/recipes/{recipeId}/logs/{logId}", server.recipeLogHandler)
	server.r.Delete("/api/recipes/{recipeId}/logs/{logId}", server.deleteRecipeLogHandler)

	if cfg.Frontend.EnableProxy {
		slog.Info("Proxying requests to frontend dev server at", "endpoint", "http://localhost:3000")
		// Proxy all non-/api requests to another host (e.g., frontend dev server)
		server.r.NotFound(proxyToHost("http://localhost:3000"))
	} else {
		slog.Info("Serving static files from", "path", "public")
		// Serve static files, and if not found, serve index.html (SPA fallback)
		server.r.NotFound(func(w http.ResponseWriter, r *http.Request) {
			// Only fallback for non-API routes
			if len(r.URL.Path) >= 4 && r.URL.Path[:4] == "/api" {
				http.NotFound(w, r)
				return
			}
			// Try to serve the static file
			filePath := "public" + r.URL.Path
			if info, err := os.Stat(filePath); err == nil && !info.IsDir() {
				http.ServeFile(w, r, filePath)
				return
			}
			// Fallback to index.html
			http.ServeFile(w, r, "public/index.html")
		})
	}

	slog.Info("Server started at", "port", cfg.Server.Port)

	return &server
}

func (s *WebServer) ListenAndServe() error {
	err := http.ListenAndServe(":"+s.Port, s.r)
	if err != nil {
		return errors.Join(err, errors.New("failed to start server"))
	}
	return nil
}

// proxyToHost returns an http.HandlerFunc that proxies requests to the given host
func proxyToHost(target string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		proxy := &httputil.ReverseProxy{
			Director: func(req *http.Request) {
				req.URL.Scheme = "http"
				req.URL.Host = "localhost:5173"
				req.URL.Path = r.URL.Path
				req.URL.RawQuery = r.URL.RawQuery
				req.Header = r.Header
			},
		}
		proxy.ServeHTTP(w, r)
	}
}

func (s *WebServer) listRecipesHandler(w http.ResponseWriter, r *http.Request) {
	recipes, err := s.db.GetRecipes()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(recipes); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *WebServer) recipeHandler(w http.ResponseWriter, r *http.Request) {
	recipe, err := s.db.GetRecipe(r.PathValue("recipeId"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(recipe); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *WebServer) recipeHistoryHandler(w http.ResponseWriter, r *http.Request) {
	recipe, err := s.db.GetRecipeHistory(r.PathValue("recipeId"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(recipe); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *WebServer) newRecipeHandler(w http.ResponseWriter, r *http.Request) {
	var recipe models.Recipe
	if err := json.NewDecoder(r.Body).Decode(&recipe); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	err := s.db.AddOrUpdateRecipe(recipe, r.URL.Query().Get("commitMessage"), r.URL.Query().Get("author"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(recipe); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *WebServer) dbPushHandler(w http.ResponseWriter, r *http.Request) {
	err := s.db.Push()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (s *WebServer) dbPullHandler(w http.ResponseWriter, r *http.Request) {
	err := s.db.Pull()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (s *WebServer) recipeLogsHandler(w http.ResponseWriter, r *http.Request) {
	recipeLogs, err := s.db.GetRecipeLogs(r.PathValue("recipeId"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(recipeLogs); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *WebServer) recipeLogHandler(w http.ResponseWriter, r *http.Request) {
	recipeLog, err := s.db.GetRecipeLog(r.PathValue("recipeId"), r.PathValue("logId"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(recipeLog); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *WebServer) newRecipeLogHandler(w http.ResponseWriter, r *http.Request) {
	var recipe models.RecipeLog
	if err := json.NewDecoder(r.Body).Decode(&recipe); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	err := s.db.AddRecipeLog(recipe, r.URL.Query().Get("commitMessage"), r.URL.Query().Get("author"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(recipe); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *WebServer) deleteRecipeLogHandler(w http.ResponseWriter, r *http.Request) {
	err := s.db.DeleteRecipeLog(r.PathValue("recipeId"), r.PathValue("logId"), r.URL.Query().Get("commitMessage"), r.URL.Query().Get("author"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent) // 204 No Content
	slog.Info("Deleted recipe log", "recipeId", r.PathValue("recipeId"), "logId", r.PathValue("logId"))
}
