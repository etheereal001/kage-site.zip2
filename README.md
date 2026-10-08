# KAGE — Anime Sitesi (statik arayüz + Cloudflare API + D1)

Herkese açık, **ücretsiz** barındırılan, JavaScript ile yazılmış site. Tek dosyalık `index.html`
klasörlere ve dosyalara ayrıldı; yönetim paneli gerçek bir **CMS**'e dönüştü (veriler sunucuda durur,
herkes aynı içeriği görür).

## Klasör yapısı

```
kage-site/
├─ public/                    ← sitenin kendisi (olduğu gibi yayınlanır)
│  ├─ index.html              ← sadece iskelet + <link>/<script> etiketleri
│  ├─ _headers  robots.txt
│  ├─ css/                    ← 15 dosya, sıra numarasıyla yüklenir
│  │  01-tokens … 15-responsive
│  └─ js/
│     ├─ config.js            ← apiBase ayarı
│     ├─ utils.js
│     ├─ boot.js              ← başlangıç
│     ├─ data/                ← constants.js, anime-seed.js (başlangıç kataloğu)
│     ├─ core/                ← store, remote (sunucu), api, router, render, after-render
│     ├─ views/               ← home, browse, anime, watch, comments, profile, admin
│     ├─ ui/                  ← components, player, search, support, modals
│     └─ events/              ← click.js, forms.js
├─ functions/api/[[path]].js  ← /api/* — Cloudflare Pages Functions (JavaScript)
├─ db/schema.sql              ← D1 (SQLite) tabloları
├─ scripts/                   ← dev-server.mjs, d1-sqlite.mjs (yerel çalıştırma)
├─ tests/api.test.mjs         ← API testleri (npm test)
├─ wrangler.toml  package.json
```

> JS dosyaları ES module değil, sıralı klasik `<script defer>` dosyalarıdır; hepsi aynı global kapsamı
> paylaşır. Yükleme sırası `public/index.html` içindeki sıradır — yeni dosya eklersen o sıraya ekle.

## Hangi veri nerede?

| Veri | Nerede | Kim düzenler |
|---|---|---|
| Anime ekleme/düzenleme/silme, bölümler, türler | Sunucu (D1) | Sadece yönetici |
| Yorumlar, beğeniler | Sunucu (D1) | Herkes yazar; sahibi veya yönetici siler |
| Destek talepleri ve yanıtlar | Sunucu (D1) | Herkes açar; yönetici yanıtlar |
| Hesap profili, favoriler, izleme listesi, puanlar, geçmiş | Ziyaretçinin tarayıcısı | Ziyaretçi |

Yönetici girişi sunucudaki `ADMIN_PASSWORD` ile yapılır (`#/admin`). Parola ve token tarayıcı
verisinden okunmaz; tarayıcıdan "admin" yapmanın yolu yoktur.

## Yerelde çalıştırma (hesap gerekmez)

Node 22+ yeterli, kurulum yok:

```bash
npm run dev          # http://localhost:8788   — yönetici parolası: kage-dev
npm test             # API testleri
```

## Ücretsiz yayına alma (Cloudflare Pages + D1)

Alan adı almana gerek yok; `https://<proje-adı>.pages.dev` adresi ücretsiz verilir.

1. Ücretsiz bir [Cloudflare](https://dash.cloudflare.com/sign-up) hesabı aç.
2. Terminalde proje klasöründe:
   ```bash
   npm install
   npx wrangler login
   npm run db:create        # çıktıdaki database_id değerini wrangler.toml'a yapıştır
   npm run db:init          # tabloları oluşturur
   npx wrangler pages project create kage --production-branch main
   npm run deploy           # public/ + functions/ yüklenir
   ```
3. Yönetici parolası ve imza anahtarını tanımla, sonra tekrar yayınla:
   ```bash
   npx wrangler pages secret put ADMIN_PASSWORD --project-name kage    # güçlü bir parola gir
   npx wrangler pages secret put TOKEN_SECRET   --project-name kage    # 32+ rastgele karakter
   npm run deploy
   ```
4. `https://kage.pages.dev` (proje adına göre değişir) açılır. `#/admin` → parolanla giriş yap.

### GitHub'a push edince otomatik yayın

`.github/workflows/deploy.yml` hazır. Bir kez şunları yap:

1. Cloudflare'de proje + D1 + iki secret'ı yukarıdaki 1-3. adımlarla oluştur (`wrangler.toml`'daki `database_id` dolu olsun).
2. Cloudflare → My Profile → API Tokens → **Edit Cloudflare Workers** şablonuyla token üret; Pages ve D1 yetkisi olsun.
3. GitHub reposu → Settings → Secrets and variables → Actions: `CLOUDFLARE_API_TOKEN` ve `CLOUDFLARE_ACCOUNT_ID` ekle.
4. `main` dalına push et; her push testleri çalıştırıp siteyi günceller.

Alternatif: kodu GitHub'a yükleyip Cloudflare panelinde **Workers & Pages → Create → Pages → Connect to Git**
ile bağlayabilirsin (build komutu boş, çıktı klasörü `public`); D1 bağlantısını ve iki gizli değişkeni
panelden ekle.

Ücretsiz plan sınırları (Cloudflare'in güncel fiyat sayfasından doğrula): statik içerik sınırsız
bant genişliği; Functions günlük ~100 bin istek; D1 için cömert bir ücretsiz kota.

## Bilinen sınırlar

- **Hesaplar tarayıcıya özeldir.** Kayıt/giriş, favoriler ve liste cihazlar arasında taşınmaz.
  Gerçek hesaplar istenirse `/api/auth/*` ve kullanıcı verisi senkronu eklenmeli.
- **Video demo dosyasıdır.** Oynatıcı herkese açık örnek bir MP4 kullanır; bölüm başına
  video adresi alanı henüz yok.
- Başlangıç kataloğu `public/js/data/anime-seed.js` içindedir; panelden yapılan değişiklikler
  bu katalogun üstüne (override / silme / ekleme olarak) sunucuda saklanır.
- Yorum ve talep gönderimi IP başına hız sınırlıdır; yönetici girişi 10 dakikada 8 deneme ile sınırlıdır.
