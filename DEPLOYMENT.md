# Panduan Deployment DramaQu

## Masalah: API Proxy di Production

Ketika build dan deploy, API request ke `/api` return HTML bukan JSON. Ini terjadi karena:

1. **`devProxy` hanya bekerja di development mode**
2. **Server middleware hanya bekerja jika deploy sebagai Nitro server** (bukan static site)

## Solusi 1: Deploy sebagai Nitro Server (Recommended)

### Build & Deploy

```bash
# Build aplikasi
npm run build

# Deploy folder .output/server ke server Anda
# Atau gunakan PM2 untuk menjalankan server
```

### Menggunakan PM2

```bash
# Install PM2
npm install -g pm2

# Jalankan server
pm2 start .output/server/index.mjs --name dramaqu

# Atau dengan ecosystem file
pm2 start ecosystem.config.js
```

**ecosystem.config.js:**

```javascript
module.exports = {
  apps: [
    {
      name: "dramaqu",
      script: ".output/server/index.mjs",
      instances: 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
}
```

### Menggunakan Docker

**Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
```

## Solusi 2: Setup Proxy di Server Level (Nginx)

Jika Anda menggunakan static hosting atau ingin setup proxy di server level:

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve static files
    location / {
        root /path/to/your/.output/public;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api {
        proxy_pass https://dramabox.sansekai.my.id/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
        add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
    }
}
```

## Solusi 3: Environment Variable (Jika API Support CORS)

Jika API Anda sudah support CORS, Anda bisa langsung call API tanpa proxy:

1. Buat file `.env`:

```env
NUXT_PUBLIC_API_BASE_URL=https://dramabox.sansekai.my.id/api
```

2. Update `nuxt.config.ts`:

```typescript
runtimeConfig: {
  public: {
    apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || "https://dramabox.sansekai.my.id/api"
  }
}
```

3. Update semua file yang menggunakan BASE_URL untuk menggunakan `useRuntimeConfig()`

## Testing Production Build

```bash
# Build
npm run build

# Preview (test local)
npm run preview

# Test API proxy
curl http://localhost:3000/api/dramabox/foryou
```

## Troubleshooting

### API masih return HTML

1. Pastikan deploy sebagai Nitro server (bukan static)
2. Pastikan server middleware di `server/api/[...].ts` sudah ter-build
3. Cek log server untuk error

### CORS Error

1. Pastikan proxy sudah ter-setup dengan benar
2. Cek header `Access-Control-Allow-Origin` di response

### 404 Error

1. Pastikan route `/api/**` sudah ter-handle oleh server middleware
2. Cek file `server/api/[...].ts` sudah ada

### VIP System (IndexedDB)

Sistem VIP menggunakan IndexedDB untuk menyimpan data VIP codes. Ini bekerja di HTTP dan HTTPS.

1. **VIP Codes disimpan di IndexedDB:**

   - Data disimpan dengan checksum untuk integrity
   - Jika data diubah manual, checksum akan invalid dan data akan di-clear
   - Codes disimpan sebagai hash (bukan plain text)

2. **Clear VIP data (jika perlu):**

   - Buka DevTools → Application → IndexedDB → VIP_DB
   - Delete object store "vip"
   - Refresh page

3. **Troubleshooting:**
   - Jika VIP tidak aktif setelah input code, cek browser console untuk error
   - Pastikan IndexedDB didukung (semua browser modern mendukung)
   - Jika ada masalah, clear IndexedDB dan coba lagi
