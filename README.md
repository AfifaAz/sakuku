# Sakuku

Website keuangan pribadi untuk mobile-first dengan tema biru muda, laporan bulanan, input pemasukan/pengeluaran, dan transaksi yang bisa diedit atau dihapus.

## Fitur
- Total saldo dan total kepemilikan
- Nilai investasi
- Grafik pengeluaran per hari
- Pilihan bulan
- Input pemasukan dan pengeluaran dengan tanggal
- Daftar transaksi yang bisa diedit dan dihapus
- Halaman laporan keuangan dengan rentang tanggal

## Cara jalankan lokal
Python:

```bash
cd C:\Project\Sakuku
py -m http.server 8000
```

Lalu buka `http://localhost:8000/`

## Deploy ke Vercel
1. Push repo ke GitHub.
2. Import repo di Vercel.
3. Gunakan pengaturan default project static.
4. Deploy.

Data transaksi tersimpan di browser menggunakan localStorage.
