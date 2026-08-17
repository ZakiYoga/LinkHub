# LinkHub

Aplikasi direktori link (Google Sheets, Slides, Drive, dsb) dengan struktur folder + tag,
mirip Google Drive tapi khusus untuk landing page tim. Guest bisa browse & cari tanpa
login; admin bisa kelola folder, item, dan tag setelah login.

> Nama "LinkHub" sementara — ganti sesuai keinginan di `go.mod` dan `package.json` kalau perlu.

---

## Daftar Isi

- [Ringkasan](#ringkasan)
- [Tech Stack](#tech-stack)
- [Struktur Repo](#struktur-repo)
- [Arsitektur](#arsitektur)
- [Menjalankan Backend](#menjalankan-backend)
- [Menjalankan Frontend](#menjalankan-frontend)
- [Menjalankan dengan Docker Compose](#menjalankan-dengan-docker-compose)
- [Skema Database](#skema-database)
- [Dokumentasi API](#dokumentasi-api)
- [Autentikasi](#autentikasi)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)

---

## Ringkasan

| | |
|---|---|
| Peran pengguna | **Guest** (publik, read-only) dan **Admin** (login, kelola folder & item) |
| Backend | Go (chi + GORM + PostgreSQL) |
| Frontend | React + Vite (JavaScript murni + PropTypes, bukan TypeScript) |
| Auth | JWT, satu akun admin (di-seed sekali, tidak ada endpoint register) |
| Database | PostgreSQL, migrasi lewat `golang-migrate` (SQL murni, bukan AutoMigrate) |

Fitur inti:
- Navigasi folder bersarang (nested) + breadcrumb
- CRUD folder & item (link) khusus admin
- Filter kombinasi tipe (`spreadsheet`, `slides`, `drive`, `document`, `form`, `other`) + tag (OR)
- Pencarian global lintas seluruh folder, tiap hasil menampilkan breadcrumb lokasi
- Dialog konfirmasi hapus folder yang adaptif (menghitung subfolder & item secara rekursif)
- Validasi & normalisasi URL supaya tidak ada link duplikat

---

## Tech Stack

### Backend

| Kebutuhan | Library |
|---|---|
| Router | `go-chi/chi/v5` |
| ORM | `gorm.io/gorm` + `gorm.io/driver/postgres` |
| Migrasi | `golang-migrate/migrate` (SQL murni) |
| Auth | `golang-jwt/jwt/v5` + `golang.org/x/crypto/bcrypt` |
| Validasi | `go-playground/validator/v10` |
| UUID | `google/uuid` |
| CORS | `go-chi/cors` |
| Config | `joho/godotenv` |
| Logging | `log/slog` (stdlib) |

### Frontend

| Kebutuhan | Library |
|---|---|
| Build tool | Vite (template `react`, JavaScript) |
| Styling | Tailwind CSS |
| Icon | react-icons |
| State management | zustand |
| HTTP client | axios |
| Validasi form | zod |
| Type-safety runtime | PropTypes |
| Routing | react-router-dom |

---

## Struktur Repo

```
.
├── linkhub-backend/          # Go API
│   ├── cmd/
│   │   ├── api/               # entrypoint HTTP server
│   │   └── seed/              # seed 1 akun admin
│   ├── internal/
│   │   ├── config/            # load .env + koneksi Postgres
│   │   ├── model/              # struct GORM (User, Folder, MenuItem, Tag)
│   │   ├── dto/                # input/filter structs
│   │   ├── repository/         # akses data (interface-based)
│   │   ├── service/             # business logic
│   │   ├── handler/             # parsing request/response
│   │   ├── middleware/          # auth JWT, logger
│   │   └── router/              # daftar route
│   ├── migrations/              # SQL migrasi (golang-migrate)
│   ├── pkg/
│   │   ├── response/            # JSON envelope konsisten
│   │   └── apperror/            # typed HTTP error
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .env.example
│
└── linkhub-frontend/          # React + Vite SPA
    ├── src/
    │   ├── pages/                # LandingPage, FolderPage, SearchResultsPage, LoginPage, AdminTagsPage
    │   ├── components/           # FolderCard, ItemCard, Breadcrumb, SearchBar, FilterChips, dst
    │   ├── stores/                # zustand: authStore, filterStore
    │   ├── api/                   # axios client per resource
    │   ├── schemas/                # validasi zod
    │   ├── types/                  # PropTypes
    │   ├── hooks/                   # useDebounce, dst
    │   └── routes/                  # AppRoutes.jsx
    ├── vite.config.js
    ├── tailwind.config.js
    └── .env.example
```

---

## Arsitektur

```
[ React (Vite) SPA ]
        │  axios (JWT bearer)
        ▼
[ Go API (chi router) ]
   handler → service → repository (GORM)
        │
        ▼
[ PostgreSQL ]
```

Backend dipisah 3 lapis, tiap lapis hanya kenal lapis di bawahnya:

- **handler** — parsing request, tulis response JSON, panggil service. Tidak ada logic bisnis di sini.
- **service** — business logic: validasi bisnis, normalisasi URL, bangun breadcrumb, dsb.
- **repository** — satu-satunya lapis yang bicara ke GORM/SQL. Diakses lewat interface supaya service bisa di-unit-test dengan mock.

---

## Menjalankan Backend

### Prasyarat
- Go 1.22+
- PostgreSQL 14+ (lokal atau via Docker)
- [`golang-migrate` CLI](https://github.com/golang-migrate/migrate) untuk menjalankan migrasi SQL

### Langkah-langkah

1. Masuk ke folder backend:
   ```bash
   cd linkhub-backend
   ```

2. Buat database Postgres (contoh lewat `psql`):
   ```sql
   CREATE DATABASE linkhub;
   CREATE USER linkhub WITH PASSWORD 'linkhub';
   GRANT ALL PRIVILEGES ON DATABASE linkhub TO linkhub;
   ```

3. Copy file environment lalu sesuaikan:
   ```bash
   cp .env.example .env
   ```
   Minimal isi `DATABASE_URL`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`.

4. Download dependency Go:
   ```bash
   go mod tidy
   ```

5. Install `golang-migrate` CLI (sekali saja, kalau belum ada):
   ```bash
   go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
   ```

6. Jalankan migrasi:
   ```bash
   migrate -database "$DATABASE_URL" -path migrations up
   ```
   Kalau perlu rollback: `migrate -database "$DATABASE_URL" -path migrations down 1`

7. Seed akun admin tunggal (baca `ADMIN_USERNAME` / `ADMIN_PASSWORD` dari `.env`, aman dijalankan berulang — otomatis skip kalau sudah ada user):
   ```bash
   go run ./cmd/seed
   ```

8. Jalankan server API:
   ```bash
   go run ./cmd/api
   ```
   Server aktif di `http://localhost:8080`. Cek kesehatan server:
   ```bash
   curl http://localhost:8080/healthz
   ```

---

## Menjalankan Frontend

### Prasyarat
- Node.js 18+
- Backend sudah jalan di `http://localhost:8080` (lihat bagian sebelumnya)

### Langkah-langkah

1. Masuk ke folder frontend:
   ```bash
   cd linkhub-frontend
   ```

2. Copy file environment:
   ```bash
   cp .env.example .env
   ```
   Default `VITE_API_URL=http://localhost:8080/api/v1` sudah cocok untuk setup lokal di atas.

3. Install dependency:
   ```bash
   npm install
   ```

4. Jalankan dev server:
   ```bash
   npm run dev
   ```
   Buka `http://localhost:5173`.

5. Untuk build production:
   ```bash
   npm run build
   ```
   Hasil build ada di `dist/`, siap disajikan lewat Nginx atau static hosting lain.

### Alur pakai setelah kedua server jalan

- Buka `http://localhost:5173` → halaman browse folder (guest, publik).
- Buka `http://localhost:5173/login` → login pakai `ADMIN_USERNAME` / `ADMIN_PASSWORD` dari `.env` backend.
- Setelah login, token JWT tersimpan di `localStorage` (zustand persist) dan otomatis terpasang di header `Authorization` untuk request selanjutnya — tapi UI untuk create/edit folder & item belum dibuatkan tombolnya di MVP ini (baru API-nya yang siap); form admin ada di roadmap (lihat bawah).

---

## Menjalankan dengan Docker Compose

Cara tercepat untuk mencoba backend + database tanpa install Postgres manual:

```bash
cd linkhub-backend
docker compose up --build -d
docker compose exec backend /bin/seed
```

Ini akan menjalankan:
- `db` — PostgreSQL 16
- `backend` — Go API di port `8080`

> Catatan: migrasi SQL belum otomatis dijalankan di dalam container pada `docker-compose.yml` ini — jalankan `migrate` dari mesin host ke `DATABASE_URL` yang sama (`postgres://linkhub:linkhub@localhost:5432/linkhub?sslmode=disable`), atau tambahkan service migrasi terpisah kalau mau full-otomatis.

Frontend belum di-dockerize di `docker-compose.yml` bawaan (jalankan `npm run dev` terpisah saat development). Untuk deployment production, build frontend jadi static files lalu serve lewat Nginx yang reverse-proxy `/api/*` ke container backend.

---

## Skema Database

| Tabel | Deskripsi |
|---|---|
| `users` | Akun admin (hanya 1 baris, di-seed sekali) |
| `folders` | Self-referencing lewat `parent_id`, cascade delete ke subfolder |
| `menu_items` | Item link, `folder_id` nullable (null = root), `url` unik |
| `tags` | Label bebas untuk filter lintas folder |
| `menu_item_tags` | Join table many-to-many antara item dan tag |

Detail kolom & keputusan desain (kenapa tidak ada kolom `order`/`status`, kenapa `ON DELETE CASCADE`,
dst) ada di file migrasi SQL (`linkhub-backend/migrations/`) dan dokumen perancangan sistem.

---

## Dokumentasi API

Semua response memakai envelope konsisten:
```json
{ "success": true, "data": { }, "error": null }
```

Base URL: `http://localhost:8080/api/v1`

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/auth/login` | - | Login admin → JWT |
| GET | `/folders?parent_id=` | Publik | List folder satu level (mode browse) |
| GET | `/folders/{id}` | Publik | Detail folder + breadcrumb |
| GET | `/folders/{id}/summary` | Admin | Hitung subfolder & item rekursif (untuk dialog hapus) |
| POST | `/folders` | Admin | Buat folder |
| PATCH | `/folders/{id}` | Admin | Update folder |
| DELETE | `/folders/{id}` | Admin | Hapus folder (cascade) |
| GET | `/items?folder_id=&type=&tag=&sort=&page=&limit=` | Publik | List & filter item di satu folder |
| GET | `/search?q=&type=&tag=&page=&limit=` | Publik | Pencarian global lintas folder |
| POST | `/items` | Admin | Buat menu item (validasi URL unik) |
| PATCH | `/items/{id}` | Admin | Update menu item |
| DELETE | `/items/{id}` | Admin | Hapus menu item |
| GET | `/tags` | Publik | List semua tag |
| POST | `/tags` | Admin | Buat tag baru |
| PATCH | `/tags/{id}` | Admin | Rename tag |
| DELETE | `/tags/{id}` | Admin | Hapus tag |

### Contoh request

**Login:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Buat folder (admin):**
```bash
curl -X POST http://localhost:8080/api/v1/folders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"Marketing","parent_id":null}'
```

**Buat item (admin):**
```bash
curl -X POST http://localhost:8080/api/v1/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "name": "Laporan Q3",
    "url": "https://docs.google.com/spreadsheets/d/xxxx",
    "type": "spreadsheet",
    "folder_id": null,
    "description": "Laporan penjualan kuartal 3"
  }'
```

**Search global:**
```bash
curl "http://localhost:8080/api/v1/search?q=laporan&type=spreadsheet"
```

---

## Autentikasi

1. Admin submit form login → `POST /api/v1/auth/login {username, password}`
2. Backend cek `bcrypt.CompareHashAndPassword`, terbitkan JWT (`sub`, `role`, `exp`)
3. Frontend simpan token di `authStore` (zustand + `persist` → localStorage)
4. Interceptor axios menempel header `Authorization: Bearer <token>` di tiap request
5. Middleware `RequireAdmin` di backend memvalidasi JWT pada route admin, balas `401` jika invalid/expired
6. Kalau backend membalas `401`, interceptor axios otomatis logout (hapus token dari store)

**Tidak ada endpoint register.** Akun admin cuma satu, dibuat lewat `go run ./cmd/seed` yang
membaca `ADMIN_USERNAME` / `ADMIN_PASSWORD` dari `.env`. Kalau ingin ganti password, ubah `.env`
lalu hapus baris admin di tabel `users` sebelum menjalankan seed lagi (atau update `password_hash`
manual lewat `psql` dengan hash bcrypt baru).

---

## Environment Variables

### Backend (`linkhub-backend/.env`)

| Variable | Default | Keterangan |
|---|---|---|
| `PORT` | `8080` | Port HTTP server |
| `DATABASE_URL` | `postgres://linkhub:linkhub@localhost:5432/linkhub?sslmode=disable` | Connection string Postgres |
| `JWT_SECRET` | `dev-secret-change-me` | **Wajib diganti** untuk production |
| `JWT_EXPIRY_HOURS` | `24` | Masa berlaku token |
| `ADMIN_USERNAME` | `admin` | Username admin yang di-seed |
| `ADMIN_PASSWORD` | `admin123` | Password admin yang di-seed — **wajib diganti** |
| `CORS_ORIGIN` | `http://localhost:5173` | Origin frontend yang diizinkan |

### Frontend (`linkhub-frontend/.env`)

| Variable | Default | Keterangan |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080/api/v1` | Base URL API backend |

---

## Troubleshooting

| Masalah | Kemungkinan penyebab & solusi |
|---|---|
| `go run ./cmd/api` gagal connect DB | Cek `DATABASE_URL` di `.env`, pastikan Postgres jalan & database sudah dibuat |
| Migrasi error `extension "pgcrypto" does not exist` | Jalankan `CREATE EXTENSION IF NOT EXISTS pgcrypto;` manual di `psql`, atau pastikan user Postgres punya privilege `CREATEDB`/superuser saat migrasi jalan |
| Login selalu `401` | Pastikan sudah menjalankan `go run ./cmd/seed`, cek `ADMIN_USERNAME`/`ADMIN_PASSWORD` cocok dengan yang dipakai saat seed |
| Frontend kena CORS error di console | Pastikan `CORS_ORIGIN` di backend `.env` sama persis dengan origin frontend (termasuk protokol & port) |
| `go mod tidy` gagal karena tidak ada koneksi internet | Perlu akses internet untuk fetch dependency dari proxy Go module; coba lagi di jaringan yang tidak diblokir |
| Item gagal dibuat, error "URL ini sudah terdaftar" | URL dinormalisasi (trailing slash dihapus) sebelum dibandingkan — cek apakah link yang sama (tanpa slash akhir) sudah ada |

---

## Roadmap

Status saat ini: backend API inti (folder, item, tag, auth, search, summary) dan frontend
browse/search/login sudah jalan end-to-end. Yang masih perlu dikerjakan:

- [ ] Form admin (modal create/edit folder & item) dengan validasi zod + PropTypes
- [ ] `DeleteConfirmDialog` adaptif yang memanggil endpoint `/folders/{id}/summary`
- [ ] Proteksi route admin di frontend (redirect ke `/login` kalau belum auth)
- [ ] Code splitting rute admin dengan `React.lazy` + `Suspense`
- [ ] Unit test: `buildFolderTree`, `menuItemFormSchema`, komponen `ItemCard` (Vitest + Testing Library)
- [ ] Unit test backend: table-driven test untuk service layer (pakai mock repository)
- [ ] Dockerize frontend + `docker-compose.yml` gabungan (db + backend + frontend/nginx) untuk deploy ke VPS

Referensi lengkap keputusan desain ada di dokumen perancangan sistem (`perancangan-sistem-linkhub.md`).
