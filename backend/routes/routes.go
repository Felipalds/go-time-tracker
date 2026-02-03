package routes

import (
	"github.com/Felipalds/go-pomodoro/handlers"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"go.uber.org/zap"
)

// SetupRoutes configures all API routes
func SetupRoutes(logger *zap.Logger) *chi.Mux {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)

	// CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:*", "http://127.0.0.1:*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Initialize handlers
	categoryHandler := &handlers.CategoryHandler{Logger: logger}
	tagHandler := &handlers.TagHandler{Logger: logger}
	activityHandler := &handlers.ActivityHandler{Logger: logger}
	timeEntryHandler := &handlers.TimeEntryHandler{Logger: logger}

	// API routes
	r.Route("/api", func(r chi.Router) {
		// Categories
		r.Route("/categories", func(r chi.Router) {
			r.Get("/", categoryHandler.GetCategories)
			r.Get("/{id}", categoryHandler.GetCategory)
			r.Put("/{id}", categoryHandler.UpdateCategory)
			r.Delete("/{id}", categoryHandler.DeleteCategory)
		})

		// Tags
		r.Route("/tags", func(r chi.Router) {
			r.Get("/", tagHandler.GetTags)
			r.Get("/{id}", tagHandler.GetTag)
			r.Put("/{id}", tagHandler.UpdateTag)
			r.Delete("/{id}", tagHandler.DeleteTag)
		})

		// Activities
		r.Route("/activities", func(r chi.Router) {
			r.Get("/", activityHandler.GetActivities)
			r.Post("/", activityHandler.CreateActivity)
			r.Get("/stats", activityHandler.GetActivitiesStats)
			r.Get("/{id}", activityHandler.GetActivity)
			r.Put("/{id}", activityHandler.UpdateActivity)
			r.Delete("/{id}", activityHandler.DeleteActivity)
			r.Get("/{id}/time", activityHandler.GetActivityTime)
		})

		// Time Entries
		r.Route("/time-entries", func(r chi.Router) {
			r.Post("/start", timeEntryHandler.StartTimer)
			r.Post("/stop", timeEntryHandler.StopTimer)
			r.Get("/active", timeEntryHandler.GetActiveTimer)
			r.Delete("/{id}", timeEntryHandler.DeleteTimeEntry)
		})
	})

	return r
}
