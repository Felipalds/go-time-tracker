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

type TagHandler struct {
	Logger *zap.Logger
}

// GetTags returns all active tags
func (h *TagHandler) GetTags(w http.ResponseWriter, r *http.Request) {
	var tags []models.Tag

	// Get all tags that are not deleted
	if err := database.DB.Where("deleted_at IS NULL").Find(&tags).Error; err != nil {
		h.Logger.Error("Failed to fetch tags", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch tags")
		return
	}

	utils.SuccessResponse(w, map[string]interface{}{
		"tags": tags,
	})
}

// GetTag returns a single tag by ID
func (h *TagHandler) GetTag(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid tag ID")
		return
	}

	var tag models.Tag
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", id).First(&tag).Error; err != nil {
		h.Logger.Error("Tag not found", zap.Uint64("id", id), zap.Error(err))
		utils.ErrorResponse(w, http.StatusNotFound, "Tag not found")
		return
	}

	utils.SuccessResponse(w, tag)
}

// UpdateTag updates a tag name
func (h *TagHandler) UpdateTag(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid tag ID")
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
	if len(input.Name) == 0 || len(input.Name) > 30 {
		utils.ErrorResponse(w, http.StatusBadRequest, "Tag name must be 1-30 characters")
		return
	}

	var tag models.Tag
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", id).First(&tag).Error; err != nil {
		h.Logger.Error("Tag not found", zap.Uint64("id", id), zap.Error(err))
		utils.ErrorResponse(w, http.StatusNotFound, "Tag not found")
		return
	}

	// Update the tag
	tag.Name = input.Name
	if err := database.DB.Save(&tag).Error; err != nil {
		h.Logger.Error("Failed to update tag", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to update tag")
		return
	}

	utils.SuccessResponse(w, tag)
}

// DeleteTag soft deletes a tag
func (h *TagHandler) DeleteTag(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid tag ID")
		return
	}

	var tag models.Tag
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", id).First(&tag).Error; err != nil {
		h.Logger.Error("Tag not found", zap.Uint64("id", id), zap.Error(err))
		utils.ErrorResponse(w, http.StatusNotFound, "Tag not found")
		return
	}

	// Soft delete by setting deleted_at
	if err := database.DB.Delete(&tag).Error; err != nil {
		h.Logger.Error("Failed to delete tag", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to delete tag")
		return
	}

	utils.SuccessResponse(w, map[string]string{
		"message": "Tag deleted successfully",
	})
}
