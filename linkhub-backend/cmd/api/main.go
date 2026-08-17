package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/zaki/linkhub-backend/internal/config"
	"github.com/zaki/linkhub-backend/internal/handler"
	"github.com/zaki/linkhub-backend/internal/repository"
	"github.com/zaki/linkhub-backend/internal/router"
	"github.com/zaki/linkhub-backend/internal/service"
)

func main() {
	cfg := config.Load()

	db, err := config.NewPostgresDB(cfg)
	if err != nil {
		slog.Error("failed to connect to database", "err", err)
		os.Exit(1)
	}
	slog.Info("connected to database")

	// Wiring: repository -> service -> handler. Each layer only knows
	// about the layer directly below it, and only through interfaces
	// for the repository layer (see internal/repository).
	folderRepo := repository.NewFolderRepository(db)
	itemRepo := repository.NewItemRepository(db)
	userRepo := repository.NewUserRepository(db)
	tagRepo := repository.NewTagRepository(db)
	collabRepo := repository.NewFolderCollaboratorRepository(db)
	auditRepo := repository.NewAuditLogRepository(db)
	recentViewRepo := repository.NewRecentViewRepository(db)

	permSvc := service.NewPermissionService(folderRepo, collabRepo, cfg.JWTSecret)
	folderSvc := service.NewFolderService(folderRepo, collabRepo, auditRepo, permSvc)
	itemSvc := service.NewItemService(itemRepo, folderRepo, auditRepo, permSvc)
	authSvc := service.NewAuthService(userRepo, cfg.JWTSecret, cfg.JWTExpiryHours)
	tagSvc := service.NewTagService(tagRepo)
	userSvc := service.NewUserService(userRepo)
	recentViewSvc := service.NewRecentViewService(recentViewRepo, folderRepo, itemRepo)
	handlers := router.Handlers{
		Auth:       handler.NewAuthHandler(authSvc),
		Folder:     handler.NewFolderHandler(folderSvc),
		Item:       handler.NewItemHandler(itemSvc, folderSvc),
		Tag:        handler.NewTagHandler(tagSvc),
		User:       handler.NewUserHandler(userSvc),
		RecentView: handler.NewRecentViewHandler(recentViewSvc),
	}

	r := router.New(cfg, handlers)

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		slog.Info("server starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	// Graceful shutdown (design doc section 15.3): wait for SIGINT/SIGTERM,
	// then give in-flight requests up to 10s to finish before exiting.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("forced shutdown", "err", err)
	}
	slog.Info("server stopped")
}
