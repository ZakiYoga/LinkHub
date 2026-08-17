// cmd/seed creates the single admin account from ADMIN_USERNAME /
// ADMIN_PASSWORD in .env. There is no register endpoint (design doc
// section 7) — this is the only way an admin user ever gets created.
// Safe to run multiple times: it skips seeding if any user already exists.
package main

import (
	"context"
	"log/slog"
	"os"

	"github.com/zaki/linkhub-backend/internal/config"
	"github.com/zaki/linkhub-backend/internal/model"
	"github.com/zaki/linkhub-backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	cfg := config.Load()

	db, err := config.NewPostgresDB(cfg)
	if err != nil {
		slog.Error("failed to connect to database", "err", err)
		os.Exit(1)
	}

	userRepo := repository.NewUserRepository(db)
	ctx := context.Background()

	count, err := userRepo.Count(ctx)
	if err != nil {
		slog.Error("failed to count users", "err", err)
		os.Exit(1)
	}
	if count > 0 {
		slog.Info("admin user already exists, skipping seed")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(cfg.AdminPassword), bcrypt.DefaultCost)
	if err != nil {
		slog.Error("failed to hash password", "err", err)
		os.Exit(1)
	}

	admin := &model.User{
		Username:     cfg.AdminUsername,
		PasswordHash: string(hash),
		Role:         model.RoleAdmin,
	}
	if err := userRepo.Create(ctx, admin); err != nil {
		slog.Error("failed to create admin user", "err", err)
		os.Exit(1)
	}

	slog.Info("admin user created", "username", cfg.AdminUsername)
}
