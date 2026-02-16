

## Fitur Donasi Publik + Auto Insert Transaksi Dana Masuk

### Ringkasan
Sistem donasi publik lengkap: form donasi untuk umum, panel admin untuk approve/reject, halaman cek status donasi, dan **otomatis insert ke tabel transaksi** saat admin approve -- sehingga admin tidak perlu entry data dua kali.

### Alur Kerja

```text
DONATUR (publik, tanpa login)
  1. Buka /donasi
  2. Pilih Sumber Donasi (dari DB, exclude "Kanjeng Guru", "Belum Konfirmasi" -> "Umum")
  3. Isi Nama Donatur + Nominal (auto pemisah ribuan)
  4. Upload bukti bayar (compress max 200KB client-side)
  5. Submit -> dapat kode tracking 8 karakter
  6. Cek status di /cek-donasi dengan kode tracking

ADMIN (login)
  1. Lihat tab "Donasi Masuk" di halaman utama
  2. Klik Detail -> lihat bukti bayar
  3. Approve -> otomatis insert ke tabel transaksi sebagai Dana Masuk
     - jenis: "masuk"
     - kategori: sumber_donasi yang dipilih donatur
     - keterangan: "Donasi dari [nama_donatur]"
     - nominal: nominal donasi
     - bukti_url: bukti dari donasi
  4. Reject -> isi alasan penolakan
```

### Sumber Donasi yang Ditampilkan
- Semua dari tabel `sumber_dana` KECUALI "Kanjeng Guru KH Imroni Abdillah"
- "Belum Konfirmasi" ditampilkan sebagai **"Umum"** di form, tapi disimpan tetap sebagai "Belum Konfirmasi" di database agar cocok dengan data sumber_dana

### Detail Teknis

#### 1. Database -- Tabel Baru `donasi_publik`
```sql
CREATE TABLE public.donasi_publik (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_tracking TEXT NOT NULL UNIQUE,
  nama_donatur TEXT NOT NULL,
  sumber_donasi TEXT NOT NULL,
  nominal BIGINT NOT NULL DEFAULT 0,
  bukti_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, diterima, ditolak
  alasan_tolak TEXT,
  transaksi_id UUID REFERENCES public.transaksi(id),  -- link ke transaksi yang auto-dibuat
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

RLS Policies:
- SELECT: publik (untuk cek status via kode tracking)
- INSERT: publik (untuk submit donasi)
- UPDATE: hanya authenticated (admin approve/reject)
- DELETE: hanya authenticated

#### 2. Storage Bucket -- `donasi-bukti`
- Bucket publik untuk foto bukti bayar donatur
- Siapa saja bisa upload

#### 3. File Baru

**`src/lib/imageCompress.ts`**
- Fungsi kompresi gambar via Canvas API
- Resize + loop JPEG quality hingga di bawah 200KB
- Mengembalikan File object yang sudah terkompresi

**`src/pages/DonasiPublik.tsx`**
- Halaman form donasi publik di route `/donasi`
- Header dengan logo MDTI dan branding HBH
- Select sumber donasi dari database (filter + rename)
- Input nominal dengan auto pemisah ribuan
- Upload bukti bayar dengan preview + kompresi
- Setelah submit: tampilkan kode tracking dalam card sukses

**`src/pages/CekDonasi.tsx`**
- Halaman publik di route `/cek-donasi`
- Input kode tracking
- Tampilkan detail donasi + status (badge warna: kuning=pending, hijau=diterima, merah=ditolak)
- Jika ditolak, tampilkan alasan

**`src/components/DonasiPublikAdmin.tsx`**
- Komponen tab admin (muncul di halaman utama saat user login)
- Tabel daftar donasi masuk dengan kolom: tanggal, nama, sumber, nominal, status
- Dialog detail: info lengkap + preview bukti bayar
- Tombol Approve: 
  - Update status donasi jadi "diterima"
  - **Auto insert ke tabel `transaksi`** sebagai Dana Masuk
  - Simpan `transaksi_id` di donasi untuk referensi
- Tombol Reject: dialog input alasan, update status jadi "ditolak"

**`src/hooks/useDonasiPublik.tsx`**
- Hook untuk fetch data donasi publik (admin)
- Realtime subscription untuk update otomatis
- Mutation helpers untuk approve/reject

#### 4. Logika Auto-Insert Transaksi (saat Approve)
```text
Saat admin klik Approve:
1. Insert ke tabel transaksi:
   - tanggal: tanggal donasi dibuat
   - jenis: "masuk"
   - kategori: sumber_donasi donatur (misal "SEMARANG - PUSAT")
   - keterangan: "Donasi publik dari [nama_donatur]"
   - nominal: nominal donasi
   - bukti_url: bukti dari donasi
   - bukti_tipe: "image"
2. Update donasi_publik:
   - status: "diterima"
   - transaksi_id: id transaksi yang baru dibuat
3. Trigger existing `recalculate_sumber_dana_nominal` otomatis jalan
   -> nominal di sumber_dana ter-update otomatis
```

#### 5. File yang Dimodifikasi

**`src/App.tsx`**
- Tambah route `/donasi` dan `/cek-donasi`

**`src/pages/Index.tsx`**
- Tambah tab "Donasi Masuk" (hanya visible saat login) di desktop tabs dan mobile BottomNav
- Render `DonasiPublikAdmin` di tab tersebut

**`src/components/BottomNav.tsx`**
- Tambah tab "Donasi Masuk" (conditional, hanya saat ada prop `isAdmin`)

#### 6. Fitur Kompresi Gambar
- Client-side menggunakan Canvas API
- Resize proporsional jika dimensi terlalu besar (max 1200px)
- Loop compress JPEG quality dari 0.8 turun hingga file < 200KB
- Fallback: jika masih > 200KB setelah quality 0.1, tetap upload dengan warning

