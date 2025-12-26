# Cara Menjalankan DramaQu di Network

## 1. Mengatasi CORS
Aplikasi ini sudah dikonfigurasi dengan proxy server untuk mengatasi masalah CORS. Semua request API akan melalui proxy lokal Nuxt.

### Konfigurasi yang sudah diterapkan:
- **nuxt.config.ts**: Ditambahkan `devProxy` untuk proxy API requests
- **Semua file pages**: BASE_URL diubah dari `https://dramabox.sansekai.my.id/api` menjadi `/api`

Dengan konfigurasi ini, request akan diroute:
```
Browser → /api/dramabox/foryou → Nuxt Proxy → https://dramabox.sansekai.my.id/api/dramabox/foryou
```

## 2. Menjalankan Server dengan Network Access

### Cara 1: Menggunakan npm run dev (Sudah dikonfigurasi)
Server sudah dikonfigurasi untuk listen di `0.0.0.0:3000`, yang berarti bisa diakses dari perangkat lain.

```bash
npm run dev
```

Setelah server berjalan, Anda akan melihat output seperti:
```
➜ Local:   http://0.0.0.0:3000/
➜ Network: http://192.168.1.10:3000/ [QR code]
```

### Cara 2: Akses dari Perangkat Lain

#### Dari komputer/laptop lain di jaringan yang sama:
1. Cari IP address komputer yang menjalankan server
2. Buka browser dan akses: `http://[IP_ADDRESS]:3000`
   - Contoh: `http://192.168.1.10:3000`

#### Dari smartphone/tablet:
1. Pastikan perangkat terhubung ke WiFi yang sama
2. Scan QR code yang muncul di terminal, ATAU
3. Ketik manual di browser: `http://[IP_ADDRESS]:3000`
   - Contoh: `http://192.168.1.10:3000`

### Cara Mendapatkan IP Address:

**Windows:**
```bash
ipconfig
```
Cari "IPv4 Address" di bagian adapter WiFi/Ethernet Anda

**Linux/Mac:**
```bash
ifconfig
# atau
ip addr show
```

## 3. Troubleshooting

### Jika tidak bisa diakses dari perangkat lain:

1. **Firewall Windows:**
   - Buka Windows Defender Firewall
   - Klik "Allow an app or feature through Windows Defender Firewall"
   - Pastikan Node.js atau aplikasi Anda diizinkan untuk Private dan Public networks

2. **Antivirus:**
   - Beberapa antivirus memblokir koneksi incoming
   - Tambahkan exception untuk port 3000

3. **Router/Network:**
   - Pastikan semua perangkat di jaringan yang sama
   - Beberapa router memiliki "AP Isolation" yang memblokir komunikasi antar perangkat

### Jika masih ada CORS error:

Pastikan Anda mengakses melalui proxy yang sudah dikonfigurasi. Jika masih error, cek:
1. Server sudah restart setelah perubahan konfigurasi
2. Browser cache sudah di-clear (Ctrl + Shift + Delete)
3. Cek console browser untuk error detail

## 4. Production Build (Optional)

Untuk production build yang lebih stabil:

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

## 5. Perubahan yang Dilakukan

### File yang dimodifikasi:
1. **nuxt.config.ts** - Ditambahkan devServer dan devProxy configuration
2. **pages/index.vue** - BASE_URL diubah ke `/api`
3. **pages/search.vue** - BASE_URL diubah ke `/api`
4. **pages/detail/[id].vue** - BASE_URL diubah ke `/api`
5. **components/BannerHero.vue** - Fixed portrait image display
6. **components/BottomNav.vue** - Enhanced visibility dengan background yang lebih kontras
7. **layouts/default.vue** - Adjusted padding untuk bottom navigation

### Fitur yang sudah diperbaiki:
✅ CORS issue resolved dengan proxy
✅ Network access enabled (0.0.0.0)
✅ Banner image menampilkan portrait dengan baik (tidak terpotong)
✅ Bottom navigation terlihat jelas dengan background gray-900
