import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

export interface MigrationRecord {
  name: string;
  applied_at: string;
}

export interface MigrationStatus {
  applied: string[];
  pending: string[];
}

export function ensureMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `);
}

export function getAppliedMigrations(db: Database.Database): MigrationRecord[] {
  ensureMigrationsTable(db);
  const stmt = db.prepare('SELECT name, applied_at FROM _migrations ORDER BY name');
  return stmt.all() as MigrationRecord[];
}

export function getMigrationFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

export function runMigrations(
  db: Database.Database,
  dir?: string,
): { applied: string[]; skipped: string[] } {
  const migrationsDir = dir ?? path.join(__dirname, 'migrations');
  ensureMigrationsTable(db);

  const appliedSet = new Set(getAppliedMigrations(db).map((m) => m.name));
  const files = getMigrationFiles(migrationsDir);

  const applied: string[] = [];
  const skipped: string[] = [];

  const insertMigration = db.prepare('INSERT INTO _migrations (name) VALUES (?)');

  for (const file of files) {
    const name = file.replace(/\.sql$/, '');
    if (appliedSet.has(name)) {
      skipped.push(name);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(sql);
    insertMigration.run(name);
    applied.push(name);
  }

  return { applied, skipped };
}

export function getMigrationStatus(db: Database.Database, dir?: string): MigrationStatus {
  const migrationsDir = dir ?? path.join(__dirname, 'migrations');
  ensureMigrationsTable(db);

  const appliedSet = new Set(getAppliedMigrations(db).map((m) => m.name));
  const files = getMigrationFiles(migrationsDir);

  const applied: string[] = [];
  const pending: string[] = [];

  for (const file of files) {
    const name = file.replace(/\.sql$/, '');
    if (appliedSet.has(name)) {
      applied.push(name);
    } else {
      pending.push(name);
    }
  }

  return { applied, pending };
}
