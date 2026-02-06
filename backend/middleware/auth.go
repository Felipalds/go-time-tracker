package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/Felipalds/go-pomodoro/services"
	"github.com/Felipalds/go-pomodoro/utils"
)

// AuthMiddleware validates JWT tokens and adds user info to context
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			utils.ErrorResponse(w, http.StatusUnauthorized, "Authorization header required")
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			utils.ErrorResponse(w, http.StatusUnauthorized, "Invalid authorization header format")
			return
		}

		tokenString := parts[1]

		// Validate token
		claims, err := services.ValidateToken(tokenString)
		if err != nil {
			if err == services.ErrExpiredToken {
				utils.ErrorResponse(w, http.StatusUnauthorized, "Token has expired")
				return
			}
			utils.ErrorResponse(w, http.StatusUnauthorized, "Invalid token")
			return
		}

		// Add user info to context
		ctx := context.WithValue(r.Context(), "user_id", claims.UserID)
		ctx = context.WithValue(ctx, "user_email", claims.Email)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetUserIDFromContext extracts user ID from request context
func GetUserIDFromContext(r *http.Request) uint {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		return 0
	}
	return userID
}
