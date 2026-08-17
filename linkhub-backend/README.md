# LinkHub Backend

## Menjalankan (lokal, tanpa Docker)

1. Pastikan PostgreSQL jalan, buat database `linkhub`.
2. Copy `.env.example` -> `.env`, sesuaikan `DATABASE_URL`.
3. Install dependency:
   ```
   go mod tidy
   ```
4. Jalankan migrasi (install golang-migrate CLI dulu kalau belum ada):
   ```
   go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
   migrate -database "$DATABASE_URL" -path migrations up
   ```
5. Seed akun admin (baca ADMIN_USERNAME/ADMIN_PASSWORD dari .env):
   ```
   go run ./cmd/seed
   ```
6. Jalankan API:
   ```
   go run ./cmd/api
   ```
   Server aktif di `http://localhost:8080`, cek `GET /healthz`.

## Menjalankan lewat Docker Compose

```
docker compose up --build -d
docker compose exec backend /bin/seed
```
