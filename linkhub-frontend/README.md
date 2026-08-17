# LinkHub Frontend

## Fitur

**Guest (publik, tanpa login):**
- Browse folder + breadcrumb, search global, filter tipe & tag

**Siapapun yang login (staff maupun admin):**
- Buat folder & link baru
- Edit/hapus **hanya folder/link miliknya sendiri** (tombol edit/hapus otomatis
  muncul/hilang per item berdasarkan `created_by` dari API dibanding user yang login —
  logic yang sama seperti backend, murni untuk UI; backend tetap validasi ulang)
- Kelola kolaborator folder miliknya (tombol ikon "users" di `FolderCard`) — pilih user
  dari daftar `/users`, akses otomatis berlaku ke seluruh subfolder di dalamnya
- Halaman **Sampah** (`/trash`) — lihat & pulihkan folder/link yang sudah dihapus miliknya

**Admin:**
- Semua di atas, tanpa batas ownership (bisa edit/hapus apa saja)
- Kelola tag (`/admin/tags`)
- Kelola user (`/admin/users`) — buat akun staff/admin baru
- Sampah menampilkan **semua** folder/link terhapus, bukan cuma miliknya

## Bagaimana role diketahui

Backend tidak punya endpoint `/auth/me`, jadi frontend decode payload JWT sendiri
(`src/lib/jwt.js`) untuk membaca klaim `sub` (user id) dan `role`, lalu simpan ke
`authStore` sebagai `user: {id, role}`. Ini **bukan** untuk keamanan (backend tetap
validasi ulang di setiap request) — cuma dipakai untuk menentukan tombol apa yang
ditampilkan.

`canEditEntity(user, entity)` di `authStore.js` adalah helper tunggal yang dipakai di
`FolderPage` untuk menentukan `canEdit` per folder/item: `true` kalau admin atau
`entity.created_by === user.id`.

## Menjalankan

1. Copy `.env.example` -> `.env`, sesuaikan `VITE_API_URL`.
2. Install dependency:
   ```
   npm install
   ```
3. Jalankan dev server:
   ```
   npm run dev
   ```
   Buka `http://localhost:5173`.

Pastikan backend sudah jalan & admin sudah di-seed. Untuk mencoba alur staff, login sebagai
admin dulu, buka `/admin/users`, buat akun staff, lalu logout dan login pakai akun itu.

## Struktur tambahan untuk fitur role/ownership/collaborator

```
src/
├── lib/jwt.js                      # decode JWT payload (role, user id)
├── stores/authStore.js             # user{id,role}, selectIsAuthed, selectIsAdmin, canEditEntity
├── components/
│   ├── RequireAuth.jsx              # guard: butuh login (role apapun)
│   ├── RequireAdmin.jsx             # guard: admin saja
│   ├── RedirectIfAuthed.jsx         # guard: sudah login -> away dari /login
│   └── CollaboratorModal.jsx        # kelola kolaborator per folder
├── api/
│   ├── collaboratorApi.js
│   ├── userApi.js
│   └── trashApi.js
└── pages/
    ├── TrashPage.jsx                # /trash — restore folder/item
    └── AdminUsersPage.jsx           # /admin/users — kelola user (admin only)
```

## Yang masih di roadmap

- Unit test (Vitest + Testing Library)
- Pagination di `FolderPage` / `SearchResultsPage`
- PIN folder (§11 di dokumen rancangan) — belum ada di backend maupun frontend
- Halaman "recent activity" dari audit log — backend sudah mencatat, frontend belum menampilkan
s