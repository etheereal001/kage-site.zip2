-- KAGE — Cloudflare D1 şeması (tekrar çalıştırılabilir)
CREATE TABLE IF NOT EXISTS kv (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL,            -- 'anime-id' veya 'anime-id:sezon:bölüm'
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  text TEXT NOT NULL,
  spoiler INTEGER NOT NULL DEFAULT 0,
  likes TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  owner_hash TEXT NOT NULL,     -- yorum sahibinin gizli anahtarının SHA-256'sı (silme yetkisi)
  ip TEXT
);
CREATE INDEX IF NOT EXISTS idx_comments_time ON comments(created_at DESC);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Açık',
  replies TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  ip TEXT
);
CREATE INDEX IF NOT EXISTS idx_tickets_time ON tickets(created_at DESC);

CREATE TABLE IF NOT EXISTS hits (            -- basit hız sınırlama
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  ip TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hits ON hits(kind, ip, at);
