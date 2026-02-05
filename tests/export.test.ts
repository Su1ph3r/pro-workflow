import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createStore, Store } from '../src/db/store';
import {
  exportLearnings,
  exportToFile,
  importLearnings,
  importFromFile,
  ExportData,
} from '../src/export';

describe('Export/Import', () => {
  let store: Store;
  let tmpDir: string;

  beforeEach(() => {
    store = createStore(':memory:');
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-test-'));

    // Seed data
    store.addLearning({
      project: 'proj-a',
      category: 'Testing',
      rule: 'Write unit tests',
      mistake: 'No tests',
      correction: 'Added tests',
    });
    store.addLearning({
      project: 'proj-b',
      category: 'Git',
      rule: 'Use conventional commits',
      mistake: null,
      correction: null,
    });
    store.addLearning({
      project: null,
      category: 'Architecture',
      rule: 'Keep modules decoupled',
      mistake: 'Tight coupling',
      correction: 'Dependency injection',
    });

    store.startSession('sess-1', 'proj-a');
  });

  afterEach(() => {
    store.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('exportLearnings', () => {
    it('should export all learnings', () => {
      const data = exportLearnings(store.db);
      expect(data.version).toBe(1);
      expect(data.exported_at).toBeDefined();
      expect(data.learnings).toHaveLength(3);
      expect(data.sessions).toBeUndefined();
    });

    it('should filter by project', () => {
      const data = exportLearnings(store.db, { project: 'proj-a' });
      // proj-a + null project learnings
      for (const l of data.learnings) {
        expect(l.project === 'proj-a' || l.project === null).toBe(true);
      }
    });

    it('should include sessions when requested', () => {
      const data = exportLearnings(store.db, { includeSessions: true });
      expect(data.sessions).toBeDefined();
      expect(data.sessions!.length).toBeGreaterThan(0);
    });

    it('should exclude sessions by default', () => {
      const data = exportLearnings(store.db);
      expect(data.sessions).toBeUndefined();
    });
  });

  describe('exportToFile', () => {
    it('should write JSON file', () => {
      const filePath = path.join(tmpDir, 'export.json');
      exportToFile(store.db, filePath);

      expect(fs.existsSync(filePath)).toBe(true);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      expect(content.version).toBe(1);
      expect(content.learnings).toHaveLength(3);
    });
  });

  describe('importLearnings', () => {
    it('should import into empty database', () => {
      const data = exportLearnings(store.db);
      const emptyStore = createStore(':memory:');

      const result = importLearnings(emptyStore.db, data);
      expect(result.imported).toBe(3);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);

      emptyStore.close();
    });

    it('should skip duplicates by default', () => {
      const data = exportLearnings(store.db);

      // Import into same DB - all should be skipped as duplicates
      const result = importLearnings(store.db, data);
      expect(result.skipped).toBe(3);
      expect(result.imported).toBe(0);
    });

    it('should allow duplicates when option is set', () => {
      const data = exportLearnings(store.db);

      const result = importLearnings(store.db, data, { allowDuplicates: true });
      expect(result.imported).toBe(3);
      expect(result.skipped).toBe(0);
    });

    it('should reject invalid data', () => {
      const result = importLearnings(store.db, {} as ExportData);
      expect(result.errors).toHaveLength(1);
      expect(result.imported).toBe(0);
    });

    it('should preserve timestamps', () => {
      const data = exportLearnings(store.db);
      const originalTimestamps = data.learnings.map((l) => l.created_at);

      const emptyStore = createStore(':memory:');
      importLearnings(emptyStore.db, data);

      const imported = emptyStore.getAllLearnings();
      for (const ts of originalTimestamps) {
        expect(imported.some((l) => l.created_at === ts)).toBe(true);
      }

      emptyStore.close();
    });
  });

  describe('round-trip', () => {
    it('should export then import producing equivalent data', () => {
      const exported = exportLearnings(store.db);
      const emptyStore = createStore(':memory:');

      importLearnings(emptyStore.db, exported);
      const reExported = exportLearnings(emptyStore.db);

      expect(reExported.learnings).toHaveLength(exported.learnings.length);

      // Check all categories match
      const origCategories = exported.learnings.map((l) => l.category).sort();
      const importedCategories = reExported.learnings.map((l) => l.category).sort();
      expect(importedCategories).toEqual(origCategories);

      emptyStore.close();
    });
  });

  describe('importFromFile', () => {
    it('should import from a JSON file', () => {
      const filePath = path.join(tmpDir, 'import.json');
      exportToFile(store.db, filePath);

      const emptyStore = createStore(':memory:');
      const result = importFromFile(emptyStore.db, filePath);
      expect(result.imported).toBe(3);

      emptyStore.close();
    });
  });
});
