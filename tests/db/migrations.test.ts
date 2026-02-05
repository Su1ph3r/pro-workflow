import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import {
  ensureMigrationsTable,
  getAppliedMigrations,
  runMigrations,
  getMigrationStatus,
} from '../../src/db/migrations';

describe('Migrations', () => {
  let db: Database.Database;
  const migrationsDir = path.join(__dirname, '../../src/db/migrations');

  beforeEach(() => {
    db = new Database(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  describe('ensureMigrationsTable', () => {
    it('should create _migrations table', () => {
      ensureMigrationsTable(db);

      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'")
        .all();
      expect(tables).toHaveLength(1);
    });

    it('should be idempotent', () => {
      ensureMigrationsTable(db);
      ensureMigrationsTable(db);

      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'")
        .all();
      expect(tables).toHaveLength(1);
    });
  });

  describe('runMigrations', () => {
    it('should apply initial migration and create all tables', () => {
      const result = runMigrations(db, migrationsDir);

      expect(result.applied).toContain('001_initial');

      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all() as { name: string }[];
      const names = tables.map((t) => t.name);
      expect(names).toContain('learnings');
      expect(names).toContain('sessions');
      expect(names).toContain('_migrations');
    });

    it('should be idempotent (running twice produces same result)', () => {
      runMigrations(db, migrationsDir);
      const result2 = runMigrations(db, migrationsDir);

      expect(result2.applied).toHaveLength(0);
      expect(result2.skipped.length).toBeGreaterThan(0);
    });

    it('should track applied migrations in _migrations table', () => {
      runMigrations(db, migrationsDir);

      const records = getAppliedMigrations(db);
      expect(records.length).toBeGreaterThan(0);
      expect(records[0].name).toBe('001_initial');
      expect(records[0].applied_at).toBeDefined();
    });

    it('should handle non-existent migrations directory', () => {
      const result = runMigrations(db, '/nonexistent/path');
      expect(result.applied).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
    });
  });

  describe('backward compatibility', () => {
    it('should handle existing schema + migrations without errors', () => {
      const schemaPath = path.join(__dirname, '../../src/db/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema);
      }

      // Run migrations on top of existing schema - should not throw
      const result = runMigrations(db, migrationsDir);
      expect(result.applied).toContain('001_initial');

      // Verify tables still work
      db.prepare("INSERT INTO learnings (category, rule) VALUES ('test', 'test rule')").run();
      const count = db.prepare('SELECT COUNT(*) as c FROM learnings').get() as { c: number };
      expect(count.c).toBe(1);
    });
  });

  describe('getMigrationStatus', () => {
    it('should report all as pending before running', () => {
      const status = getMigrationStatus(db, migrationsDir);
      expect(status.pending.length).toBeGreaterThan(0);
      expect(status.applied).toHaveLength(0);
    });

    it('should report all as applied after running', () => {
      runMigrations(db, migrationsDir);
      const status = getMigrationStatus(db, migrationsDir);
      expect(status.pending).toHaveLength(0);
      expect(status.applied.length).toBeGreaterThan(0);
    });
  });
});
