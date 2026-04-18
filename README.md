# Catatan Diki

Personal hub berbasis Next.js untuk mengelola:

- tugas & rutinitas
- target pendapatan (goals)
- keuangan (akun, kategori, transaksi, transfer, recurring, budget)
- catatan (notes)
- password manager sederhana
- file manager (metadata di Supabase, binary di Cloudflare R2)

## Stack

- Next.js 16 + React 19 + TypeScript
- Supabase (Postgres database)
- Cloudflare R2 (S3 API) untuk file storage
- Tailwind CSS 4

## Fitur Utama

1. Dashboard keuangan dengan ringkasan pemasukan/pengeluaran.
2. Task management dengan metadata finansial (`task_finance`) dan reminder (`task_reminders`).
3. Endpoint `mark_task_as_paid` untuk otomatis catat pembayaran task ke transaksi income.
4. Goals pendapatan fleksibel (harian/mingguan/bulanan/kuartalan/custom).
5. UI support light/dark mode dengan toggle.
6. Upload/download file via Cloudflare R2 (signed URL), metadata tersimpan di tabel `files`.

## Struktur Penting

- `app/api/*`: endpoint API internal
- `app/*/page.tsx`: halaman utama fitur
- `components/*`: komponen UI
- `lib/supabase.ts`: client Supabase (server-side)
- `lib/r2.ts`: konfigurasi client R2 (S3)
- `skrip.txt`: SQL schema + fungsi + view terbaru

## Prasyarat

- Node.js 20+ (disarankan LTS)
- npm
- Project Supabase
- Bucket Cloudflare R2 + Access Key

## Setup Lokal

### 1) Install dependency

```bash
npm install
```

### 2) Siapkan environment variable

Buat file `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# Cloudflare R2
R2_S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com/<bucket_name>
R2_ACCOUNT_ID=<account_id>
R2_BUCKET_NAME=<bucket_name>
R2_ACCESS_KEY_ID=<r2_access_key_id>
R2_SECRET_ACCESS_KEY=<r2_secret_access_key>

# Optional (kalau pakai public custom domain untuk file)
# R2_PUBLIC_BASE_URL=https://cdn.domainkamu.com
```

### 3) Setup database Supabase

1. Buka SQL Editor di Supabase.
2. Jalankan isi file [`skrip.txt`](./skrip.txt).
3. Pastikan eksekusi sukses (tabel, function, view, index terbentuk).

## Menjalankan Aplikasi

```bash
npm run dev
```

Buka: `http://localhost:3000`

## Build Production

```bash
npm run build
npm run start
```

## Deploy

1. Push repo ke GitHub.
2. Import project ke Vercel.
3. Tambahkan semua env variable di Vercel Project Settings.
4. Deploy.

## Catatan Keamanan

- Jangan commit `.env.local` atau secret key.
- `SUPABASE_SERVICE_ROLE_KEY` harus dipakai server-side saja.
- Jika secret pernah terekspos, segera rotate key di Supabase/R2.

## API Ringkas

- `GET/POST/PATCH/DELETE /api/tasks`
- `POST /api/tasks/mark-paid`
- `GET/POST/PATCH/DELETE /api/goals`
- `GET/POST/DELETE /api/files`
- `GET/POST/PATCH/DELETE /api/accounts`
- `GET/POST/DELETE /api/categories`
- `GET/POST/DELETE /api/transactions`
- `GET/POST/DELETE /api/transfers`
- `GET/POST/DELETE /api/recurring`
- `GET/POST/DELETE /api/budgets`
- `GET /api/dashboard`

## Default Login

Jika database baru dan seed default dipakai, password awal:

```txt
12345678
```

Segera ganti password melalui tabel `login` atau mekanisme internal kamu.

