import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import Database from 'better-sqlite3';
import { initializeDatabase } from '../src/db/index';
import {
  checkDatabase,
  checkMigrations,
  checkFtsIntegrity,
  runDiagnostics,
} from '../src/doctor';

describe('Doctor', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-doctor-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('checkDatabase', () => {
    it('should return ok for healthy database', () => {
      const dbPath = path.join(tmpDir, 'test.db');
      const db = initializeDatabase(dbPath);
      db.close();

      const result = checkDatabase(dbPath);
      expect(result.status).toBe('ok');
      expect(result.name).toBe('database');
    });

    it('should return warn for missing database', () => {
      const result = checkDatabase(path.join(tmpDir, 'nonexistent.db'));
      expect(result.status).toBe('warn');
    });

    it('should return error for missing tables', () => {
      const dbPath = path.join(tmpDir, 'empty.db');
      const db = new Database(dbPath);
      db.exec('CREATE TABLE dummy (id INTEGER)');
      db.close();

      const result = checkDatabase(dbPath);
      expect(result.status).toBe('error');
      expect(result.message).toContain('Missing tables');
    });
  });

  describe('checkMigrations', () => {
    it('should return ok when all migrations applied', () => {
      const dbPath = path.join(tmpDir, 'migrated.db');
      const db = initializeDatabase(dbPath);
      db.close();

      const result = checkMigrations(dbPath);
      expect(result.status).toBe('ok');
    });

    it('should return warn for missing database', () => {
      const result = checkMigrations(path.join(tmpDir, 'nonexistent.db'));
      expect(result.status).toBe('warn');
    });
  });

  describe('checkFtsIntegrity', () => {
    it('should return ok when FTS matches learnings', () => {
      const dbPath = path.join(tmpDir, 'fts.db');
      const db = initializeDatabase(dbPath);
      db.prepare("INSERT INTO learnings (category, rule) VALUES ('test', 'test rule')").run();
      db.close();

      const result = checkFtsIntegrity(dbPath);
      expect(result.status).toBe('ok');
    });

    it('should return warn for FTS count mismatch', () => {
      const dbPath = path.join(tmpDir, 'fts-bad.db');
      const db = initializeDatabase(dbPath);
      db.prepare("INSERT INTO learnings (category, rule) VALUES ('test', 'test rule')").run();
      // Drop content-sync FTS and create a standalone FTS with no data
      db.exec('DROP TABLE IF EXISTS learnings_fts');
      db.exec(`CREATE VIRTUAL TABLE learnings_fts USING fts5(
        category, rule, mistake, correction
      )`);
      db.close();

      const result = checkFtsIntegrity(dbPath);
      expect(result.status).toBe('warn');
      expect(result.message).toContain('mismatch');
    });

    it('should return warn for missing database', () => {
      const result = checkFtsIntegrity(path.join(tmpDir, 'nonexistent.db'));
      expect(result.status).toBe('warn');
    });
  });

  describe('runDiagnostics', () => {
    it('should return summary counts for healthy database', () => {
      const dbPath = path.join(tmpDir, 'diag.db');
      const db = initializeDatabase(dbPath);
      db.close();

      const report = runDiagnostics(dbPath);
      expect(report.checks.length).toBeGreaterThan(0);
      expect(report.ok).toBeGreaterThan(0);
      expect(typeof report.warnings).toBe('number');
      expect(typeof report.errors).toBe('number');
    });

    it('should have warnings for missing database', () => {
      const report = runDiagnostics(path.join(tmpDir, 'nonexistent.db'));
      expect(report.warnings).toBeGreaterThan(0);
    });
  });
});
