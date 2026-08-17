// Package apperror defines typed application errors that carry an HTTP
// status code. Services return these instead of calling http.Error
// directly, so the handler layer stays thin and error->status mapping
// lives in one place (pkg/response).
package apperror

import "net/http"

type AppError struct {
	Status  int    `json:"-"`
	Message string `json:"message"`
}

func (e *AppError) Error() string {
	return e.Message
}

func BadRequest(msg string) *AppError { return &AppError{Status: http.StatusBadRequest, Message: msg} }
func NotFound(msg string) *AppError   { return &AppError{Status: http.StatusNotFound, Message: msg} }
func Conflict(msg string) *AppError   { return &AppError{Status: http.StatusConflict, Message: msg} }
func Unauthorized(msg string) *AppError {
	return &AppError{Status: http.StatusUnauthorized, Message: msg}
}
func Forbidden(msg string) *AppError { return &AppError{Status: http.StatusForbidden, Message: msg} }
func Internal(msg string) *AppError {
	return &AppError{Status: http.StatusInternalServerError, Message: msg}
}

// PinRequiredError is a distinct error type (not just apperror.Forbidden)
// so the handler can tell "generic 403" apart from "this needs a PIN"
// and respond with a structured body the frontend can act on (show the
// PIN entry dialog instead of a plain error toast).
type PinRequiredError struct {
	AppError
	FolderName string
}

func PinRequired(folderName string) *PinRequiredError {
	return &PinRequiredError{
		AppError:   AppError{Status: http.StatusForbidden, Message: "folder ini dilindungi PIN"},
		FolderName: folderName,
	}
}
