package config

import (
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// NewPostgresDB opens a GORM connection. We deliberately do NOT call
// db.AutoMigrate here — schema changes go through golang-migrate SQL
// files in /migrations, so the schema stays explicit and reviewable
// (same reasoning as using Alembic instead of implicit ORM migrations).
func NewPostgresDB(cfg *Config) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return nil, err
	}
	return db, nil
}
