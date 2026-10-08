/* Cloudflare D1 arayüzünü taklit eden küçük katman (node:sqlite üzerinde).
   Yalnızca yerel geliştirme ve testler içindir; canlıda gerçek D1 kullanılır. */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function createD1(file = ':memory:'){
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  return {
    prepare(sql){
      let params = [];
      const st = {
        bind(...p){ params = p; return st; },
        async run(){ const r = db.prepare(sql).run(...params); return { success: true, meta: { changes: Number(r.changes) } }; },
        async first(){ const r = db.prepare(sql).get(...params); return r ? { ...r } : null; },
        async all(){ return { results: db.prepare(sql).all(...params).map(r => ({ ...r })) }; }
      };
      return st;
    }
  };
}
