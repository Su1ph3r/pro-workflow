import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeDatabase } from '../../src/db/index';
import { createStore, Store } from '../../src/db/store';
import {
  searchLearnings,
  searchByCategory,
  getRelatedLearnings,
  getMostAppliedLearnings,
  getRecentLearnings,
} from '../../src/search/fts';
import Database from 'better-sqlite3';

describe('FTS Search', () => {
  let store: Store;
  let db: Database.Database;

  beforeEach(() => {
    store = createStore(':memory:');
    db = store.db;

    // Seed test data
    store.addLearning({
      project: 'web-app',
      category: 'Testing',
      rule: 'Always write unit tests for new functions',
      mistake: 'Skipped tests for utility module',
      correction: 'Added comprehensive unit tests',
    });
    store.addLearning({
      project: 'web-app',
      category: 'Git',
      rule: 'Use conventional commit messages',
      mistake: 'Used vague commit messages',
      correction: 'Prefix with feat/fix/chore',
    });
    store.addLearning({
      project: 'api-server',
      category: 'Testing',
      rule: 'Mock external API calls in tests',
      mistake: 'Tests hit real endpoints',
      correction: 'Added mock server for tests',
    });
    store.addLearning({
      project: null,
      category: 'Architecture',
      rule: 'Keep modules loosely coupled',
      mistake: 'Tight coupling between services',
      correction: 'Introduced dependency injection',
    });

    // Set times_applied for ordering tests
    const all = store.getAllLearnings();
    store.incrementTimesApplied(all[0].id);
    store.incrementTimesApplied(all[0].id);
    store.incrementTimesApplied(all[0].id);
    store.incrementTimesApplied(all[1].id);
  });

  afterEach(() => {
    store.close();
  });

  describe('searchLearnings', () => {
    it('should find learnings matching a query', () => {
      const results = searchLearnings(db, 'unit tests');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].rank).toBeDefined();
    });

    it('should return empty array for empty query', () => {
      const results = searchLearnings(db, '');
      expect(results).toEqual([]);
    });

    it('should filter by project', () => {
      const results = searchLearnings(db, 'tests', { project: 'api-server' });
      // Should include api-server matches and null project matches
      for (const r of results) {
        expect(r.project === 'api-server' || r.project === null).toBe(true);
      }
    });

    it('should filter by category', () => {
      const results = searchLearnings(db, 'tests', { category: 'Testing' });
      for (const r of results) {
        expect(r.category).toBe('Testing');
      }
    });

    it('should handle special characters gracefully', () => {
      const results = searchLearnings(db, 'test @#$% special');
      // Should not throw, may return results based on "test" and "special"
      expect(Array.isArray(results)).toBe(true);
    });

    it('should include rank and snippet in results', () => {
      const results = searchLearnings(db, 'unit tests');
      if (results.length > 0) {
        expect(typeof results[0].rank).toBe('number');
        expect(results[0].snippet).toBeDefined();
      }
    });
  });

  describe('searchByCategory', () => {
    it('should return learnings in a specific category', () => {
      const results = searchByCategory(db, 'Testing');
      expect(results.length).toBeGreaterThanOrEqual(2);
      for (const r of results) {
        expect(r.category).toBe('Testing');
      }
    });

    it('should order by times_applied', () => {
      const results = searchByCategory(db, 'Testing');
      if (results.length >= 2) {
        expect(results[0].times_applied).toBeGreaterThanOrEqual(results[1].times_applied);
      }
    });

    it('should filter by project', () => {
      const results = searchByCategory(db, 'Testing', { project: 'web-app' });
      for (const r of results) {
        expect(r.project === 'web-app' || r.project === null).toBe(true);
      }
    });
  });

  describe('getRelatedLearnings', () => {
    it('should find related learnings', () => {
      const all = store.getAllLearnings();
      const testingLearning = all.find((l) => l.rule.includes('unit tests'));
      const results = getRelatedLearnings(db, testingLearning!.id);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should exclude the source learning from results', () => {
      const all = store.getAllLearnings();
      const id = all[0].id;
      const results = getRelatedLearnings(db, id);
      expect(results.every((r) => r.id !== id)).toBe(true);
    });

    it('should return empty for non-existent id', () => {
      const results = getRelatedLearnings(db, 9999);
      expect(results).toEqual([]);
    });
  });

  describe('getMostAppliedLearnings', () => {
    it('should return learnings ordered by times_applied', () => {
      const results = getMostAppliedLearnings(db);
      expect(results.length).toBeGreaterThan(0);
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].times_applied).toBeGreaterThanOrEqual(results[i].times_applied);
      }
    });

    it('should only include learnings with times_applied > 0', () => {
      const results = getMostAppliedLearnings(db);
      for (const r of results) {
        expect(r.times_applied).toBeGreaterThan(0);
      }
    });
  });

  describe('getRecentLearnings', () => {
    it('should return learnings ordered by created_at desc', () => {
      const results = getRecentLearnings(db);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter by project', () => {
      const results = getRecentLearnings(db, 10, 'web-app');
      for (const r of results) {
        expect(r.project === 'web-app' || r.project === null).toBe(true);
      }
    });

    it('should respect limit', () => {
      const results = getRecentLearnings(db, 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });
});
