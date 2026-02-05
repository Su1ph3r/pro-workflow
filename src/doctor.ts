import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { getDefaultDbPath } from './db/index';
import { getMigrationStatus } from './db/migrations';

export type CheckStatus = 'ok' | 'warn' | 'error';

export interface CheckResult {
  name: string;
  status: CheckStatus;
  message: string;
}

export interface DiagnosticsReport {
  checks: CheckResult[];
  ok: number;
  warnings: number;
  errors: number;
}

export function checkDatabase(dbPath?: string): CheckResult {
  const p = dbPath ?? getDefaultDbPath();
  if (!fs.existsSync(p)) {
    return { name: 'database', status: 'warn', message: `Database not found at ${p}` };
  }

  try {
    const db = new Database(p, { readonly: true });
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as {
      name: string;
    }[];
    db.close();

    const tableNames = new Set(tables.map((t) => t.name));
    const required = ['learnings', 'learnings_fts', 'sessions'];
    const missing = required.filter((t) => !tableNames.has(t));

    if (missing.length > 0) {
      return {
        name: 'database',
        status: 'error',
        message: `Missing tables: ${missing.join(', ')}`,
      };
    }

    return { name: 'database', status: 'ok', message: 'Database OK' };
  } catch (err) {
    return {
      name: 'database',
      status: 'error',
      message: `Database error: ${(err as Error).message}`,
    };
  }
}

export function checkMigrations(dbPath?: string): CheckResult {
  const p = dbPath ?? getDefaultDbPath();
  if (!fs.existsSync(p)) {
    return { name: 'migrations', status: 'warn', message: 'Database not found, skipping' };
  }

  try {
    const db = new Database(p);
    const status = getMigrationStatus(db);
    db.close();

    if (status.pending.length > 0) {
      return {
        name: 'migrations',
        status: 'warn',
        message: `${status.pending.length} pending migration(s): ${status.pending.join(', ')}`,
      };
    }

    return {
      name: 'migrations',
      status: 'ok',
      message: `All ${status.applied.length} migration(s) applied`,
    };
  } catch (err) {
    return {
      name: 'migrations',
      status: 'error',
      message: `Migration check error: ${(err as Error).message}`,
    };
  }
}

export function checkDistFiles(): CheckResult {
  const distDir = path.join(__dirname, '..');
  const requiredFiles = ['index.js', 'db/index.js', 'db/store.js', 'search/fts.js'];
  const missing = requiredFiles.filter((f) => !fs.existsSync(path.join(distDir, f)));

  if (missing.length > 0) {
    return {
      name: 'dist-files',
      status: 'error',
      message: `Missing dist files: ${missing.join(', ')}. Run 'npm run build'.`,
    };
  }

  return { name: 'dist-files', status: 'ok', message: 'All dist files present' };
}

export function checkFtsIntegrity(dbPath?: string): CheckResult {
  const p = dbPath ?? getDefaultDbPath();
  if (!fs.existsSync(p)) {
    return { name: 'fts-integrity', status: 'warn', message: 'Database not found, skipping' };
  }

  try {
    const db = new Database(p, { readonly: true });
    const learningsCount = (
      db.prepare('SELECT COUNT(*) as count FROM learnings').get() as { count: number }
    ).count;
    const ftsCount = (
      db.prepare('SELECT COUNT(*) as count FROM learnings_fts').get() as { count: number }
    ).count;
    db.close();

    if (learningsCount !== ftsCount) {
      return {
        name: 'fts-integrity',
        status: 'warn',
        message: `FTS index mismatch: ${learningsCount} learnings vs ${ftsCount} FTS entries`,
      };
    }

    return {
      name: 'fts-integrity',
      status: 'ok',
      message: `FTS index OK (${learningsCount} entries)`,
    };
  } catch (err) {
    return {
      name: 'fts-integrity',
      status: 'error',
      message: `FTS check error: ${(err as Error).message}`,
    };
  }
}

export function runDiagnostics(dbPath?: string): DiagnosticsReport {
  const checks = [
    checkDatabase(dbPath),
    checkMigrations(dbPath),
    checkDistFiles(),
    checkFtsIntegrity(dbPath),
  ];

  return {
    checks,
    ok: checks.filter((c) => c.status === 'ok').length,
    warnings: checks.filter((c) => c.status === 'warn').length,
    errors: checks.filter((c) => c.status === 'error').length,
  };
}
