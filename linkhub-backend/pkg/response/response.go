// Package response provides a consistent JSON envelope for every API
// response, per section 6 of the design doc:
//
//	{ "success": true, "data": {...}, "error": null }
package response

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/zaki/linkhub-backend/pkg/apperror"
)

type envelope struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Error   interface{} `json:"error"`
}

// JSON writes a successful response with the given status code and data.
func JSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(envelope{Success: true, Data: data, Error: nil})
}

// Error writes an error response. It unwraps *apperror.AppError to reuse
// its status code and message; anything else falls back to 500.
func Error(w http.ResponseWriter, fallbackStatus int, err error) {
	var appErr *apperror.AppError
	status := fallbackStatus
	msg := err.Error()

	if errors.As(err, &appErr) {
		status = appErr.Status
		msg = appErr.Message
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(envelope{Success: false, Data: nil, Error: msg})
}

// ErrorMsg is a shortcut for handler-level errors that never touched a
// service (e.g. bad JSON body, invalid path param).
func ErrorMsg(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(envelope{Success: false, Data: nil, Error: msg})
}

// ErrorWithData is like ErrorMsg but also carries a structured payload
// alongside the error message — used for the folder delete guard's 409
// response, which needs to list the blocking entities (design doc
// section 7) while still reading as an error (success: false) to any
// client that only checks the envelope.
func ErrorWithData(w http.ResponseWriter, status int, msg string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(struct {
		Success bool        `json:"success"`
		Data    interface{} `json:"data"`
		Error   string      `json:"error"`
	}{Success: false, Data: data, Error: msg})
}
