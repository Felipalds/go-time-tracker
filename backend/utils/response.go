package utils

import (
	"encoding/json"
	"io"
	"net/http"
)

// JSONResponse sends a JSON response with the given status code
func JSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// ErrorResponse sends a JSON error response
func ErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	JSONResponse(w, statusCode, map[string]string{
		"error": message,
	})
}

// SuccessResponse sends a JSON success response with data
func SuccessResponse(w http.ResponseWriter, data interface{}) {
	JSONResponse(w, http.StatusOK, data)
}

// CreatedResponse sends a 201 Created response with data
func CreatedResponse(w http.ResponseWriter, data interface{}) {
	JSONResponse(w, http.StatusCreated, data)
}

// DecodeJSON decodes JSON request body into the given interface
func DecodeJSON(r *http.Request, v interface{}) error {
	defer r.Body.Close()
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return err
	}
	return json.Unmarshal(body, v)
}

// EncodeJSON encodes data as JSON to response writer
func EncodeJSON(w http.ResponseWriter, data interface{}) error {
	return json.NewEncoder(w).Encode(data)
}
