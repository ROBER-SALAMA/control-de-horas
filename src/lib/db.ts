import type BetterSqlite3 from "better-sqlite3";
import { createClient, type Client, type InValue } from "@libsql/client";

const ESQUEMA = `
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE COLLATE NOCASE,
    creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS registros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha TEXT NOT NULL,
    foto TEXT,
    hora_ingreso TEXT NOT NULL,
    hora_salida TEXT,
    creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_registros_fecha ON registros(fecha);
  CREATE INDEX IF NOT EXISTS idx_registros_usuario ON registros(usuario_id);
`;

let turso: Client | null = null;
let local: InstanceType<typeof BetterSqlite3> | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Inicializa la conexión (una sola vez) y crea las tablas si no existen.
 * - En Vercel (o si existe TURSO_DATABASE_URL): usa Turso / libSQL en la nube.
 * - Localmente: usa SQLite en un archivo (data/control-horas.db).
 */
export function initDb(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      if (process.env.TURSO_DATABASE_URL) {
        const url = process.env.TURSO_DATABASE_URL;
        const esRemoto = url.startsWith("libsql://") || url.startsWith("https://");
        if (esRemoto && !process.env.TURSO_AUTH_TOKEN) {
          throw new Error(
            "Falta configurar TURSO_AUTH_TOKEN. Agrégalo junto a TURSO_DATABASE_URL en las variables de entorno de Vercel.",
          );
        }
        turso = createClient({
          url,
          authToken: process.env.TURSO_AUTH_TOKEN,
        });
        await turso.executeMultiple(ESQUEMA);
      } else {
        const fs = await import("fs");
        const path = await import("path");
        const dataDir = path.join(process.cwd(), "data");
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        const { default: Database } = await import("better-sqlite3");
        local = new Database(path.join(dataDir, "control-horas.db"));
        local.pragma("journal_mode = WAL");
        local.pragma("foreign_keys = ON");
        local.exec(ESQUEMA);
      }
    })();
  }
  return initPromise;
}

export interface ResultadoEjecucion {
  lastInsertRowid: number | bigint;
  changes: number;
}

/** SELECT que devuelve todas las filas. */
export async function select<T>(
  sql: string,
  args: unknown[] = [],
): Promise<T[]> {
  await initDb();
  if (turso) {
    const res = await turso.execute({ sql, args: args as InValue[] });
    return res.rows as T[];
  }
  return local!.prepare(sql).all(...args) as T[];
}

/** SELECT que devuelve una sola fila (o null si no hay). */
export async function selectOne<T>(
  sql: string,
  args: unknown[] = [],
): Promise<T | null> {
  await initDb();
  if (turso) {
    const res = await turso.execute({ sql, args: args as InValue[] });
    return (res.rows[0] as T | undefined) ?? null;
  }
  return (local!.prepare(sql).get(...args) as T | undefined) ?? null;
}

/** INSERT / UPDATE / DELETE. */
export async function execute(
  sql: string,
  args: unknown[] = [],
): Promise<ResultadoEjecucion> {
  await initDb();
  if (turso) {
    const res = await turso.execute({ sql, args: args as InValue[] });
    return {
      lastInsertRowid: res.lastInsertRowid ?? 0,
      changes: res.rowsAffected,
    };
  }
  const info = local!.prepare(sql).run(...args);
  return { lastInsertRowid: info.lastInsertRowid, changes: info.changes };
}
