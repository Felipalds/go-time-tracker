package handlers

import (
	"net/http"
	"strconv"

	"github.com/Felipalds/go-pomodoro/database"
	"github.com/Felipalds/go-pomodoro/models"
	"github.com/Felipalds/go-pomodoro/utils"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

type CategoryHandler struct {
	Logger *zap.Logger
}

// GetCategories returns all active categories
func (h *CategoryHandler) GetCategories(w http.ResponseWriter, r *http.Request) {
	var categories []models.Category

	// Get all categories that are not deleted
	if err := database.DB.Where("deleted_at IS NULL").Find(&categories).Error; err != nil {
		h.Logger.Error("Failed to fetch categories", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch categories")
		return
	}

	utils.SuccessResponse(w, map[string]interface{}{
		"categories": categories,
	})
}

// GetCategory returns a single category by ID
func (h *CategoryHandler) GetCategory(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	var category models.Category
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", id).First(&category).Error; err != nil {
		h.Logger.Error("Category not found", zap.Uint64("id", id), zap.Error(err))
		utils.ErrorResponse(w, http.StatusNotFound, "Category not found")
		return
	}

	utils.SuccessResponse(w, category)
}

// UpdateCategory updates a category name
func (h *CategoryHandler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	var input struct {
		Name string `json:"name"`
	}

	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate name
	if len(input.Name) == 0 || len(input.Name) > 50 {
		utils.ErrorResponse(w, http.StatusBadRequest, "Category name must be 1-50 characters")
		return
	}

	var category models.Category
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", id).First(&category).Error; err != nil {
		h.Logger.Error("Category not found", zap.Uint64("id", id), zap.Error(err))
		utils.ErrorResponse(w, http.StatusNotFound, "Category not found")
		return
	}

	// Update the category
	category.Name = input.Name
	if err := database.DB.Save(&category).Error; err != nil {
		h.Logger.Error("Failed to update category", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to update category")
		return
	}

	utils.SuccessResponse(w, category)
}

// DeleteCategory soft deletes a category
func (h *CategoryHandler) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	var category models.Category
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", id).First(&category).Error; err != nil {
		h.Logger.Error("Category not found", zap.Uint64("id", id), zap.Error(err))
		utils.ErrorResponse(w, http.StatusNotFound, "Category not found")
		return
	}

	// Soft delete by setting deleted_at
	if err := database.DB.Delete(&category).Error; err != nil {
		h.Logger.Error("Failed to delete category", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to delete category")
		return
	}

	utils.SuccessResponse(w, map[string]string{
		"message": "Category deleted successfully",
	})
}
