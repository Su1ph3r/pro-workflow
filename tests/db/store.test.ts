import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createStore, Store } from '../../src/db/store';

describe('Store', () => {
  let store: Store;

  beforeEach(() => {
    store = createStore(':memory:');
  });

  afterEach(() => {
    store.close();
  });

  describe('Learning CRUD', () => {
    it('should add a learning and return it with an id', () => {
      const learning = store.addLearning({
        project: 'test-project',
        category: 'Testing',
        rule: 'Always write tests',
        mistake: 'Skipped tests',
        correction: 'Added tests',
      });

      expect(learning.id).toBeDefined();
      expect(learning.category).toBe('Testing');
      expect(learning.rule).toBe('Always write tests');
      expect(learning.times_applied).toBe(0);
    });

    it('should get a learning by id', () => {
      const created = store.addLearning({
        project: null,
        category: 'Git',
        rule: 'Use conventional commits',
        mistake: null,
        correction: null,
      });

      const fetched = store.getLearning(created.id);
      expect(fetched).toBeDefined();
      expect(fetched!.category).toBe('Git');
    });

    it('should return undefined for non-existent id', () => {
      const result = store.getLearning(9999);
      expect(result).toBeUndefined();
    });

    it('should get all learnings', () => {
      store.addLearning({
        project: null,
        category: 'A',
        rule: 'Rule A',
        mistake: null,
        correction: null,
      });
      store.addLearning({
        project: null,
        category: 'B',
        rule: 'Rule B',
        mistake: null,
        correction: null,
      });

      const all = store.getAllLearnings();
      expect(all).toHaveLength(2);
    });

    it('should filter learnings by project', () => {
      store.addLearning({
        project: 'proj-a',
        category: 'A',
        rule: 'Rule A',
        mistake: null,
        correction: null,
      });
      store.addLearning({
        project: 'proj-b',
        category: 'B',
        rule: 'Rule B',
        mistake: null,
        correction: null,
      });
      store.addLearning({
        project: null,
        category: 'C',
        rule: 'Global rule',
        mistake: null,
        correction: null,
      });

      const filtered = store.getAllLearnings('proj-a');
      // Should include proj-a and null project entries
      expect(filtered.length).toBeGreaterThanOrEqual(2);
      expect(filtered.some((l) => l.category === 'A')).toBe(true);
      expect(filtered.some((l) => l.category === 'C')).toBe(true);
      expect(filtered.some((l) => l.category === 'B')).toBe(false);
    });

    it('should update a learning', () => {
      const created = store.addLearning({
        project: null,
        category: 'Old',
        rule: 'Old rule',
        mistake: null,
        correction: null,
      });

      const updated = store.updateLearning(created.id, { category: 'New' });
      expect(updated).toBe(true);

      const fetched = store.getLearning(created.id);
      expect(fetched!.category).toBe('New');
    });

    it('should return false when updating non-existent learning', () => {
      const updated = store.updateLearning(9999, { category: 'Nope' });
      expect(updated).toBe(false);
    });

    it('should delete a learning', () => {
      const created = store.addLearning({
        project: null,
        category: 'Delete',
        rule: 'To be deleted',
        mistake: null,
        correction: null,
      });

      const deleted = store.deleteLearning(created.id);
      expect(deleted).toBe(true);

      const fetched = store.getLearning(created.id);
      expect(fetched).toBeUndefined();
    });

    it('should return false when deleting non-existent learning', () => {
      const deleted = store.deleteLearning(9999);
      expect(deleted).toBe(false);
    });

    it('should increment times_applied', () => {
      const created = store.addLearning({
        project: null,
        category: 'Apply',
        rule: 'Increment me',
        mistake: null,
        correction: null,
      });

      store.incrementTimesApplied(created.id);
      store.incrementTimesApplied(created.id);

      const fetched = store.getLearning(created.id);
      expect(fetched!.times_applied).toBe(2);
    });
  });

  describe('Session Management', () => {
    it('should start a session', () => {
      const session = store.startSession('sess-1', 'test-project');
      expect(session.id).toBe('sess-1');
      expect(session.project).toBe('test-project');
      expect(session.ended_at).toBeNull();
    });

    it('should end a session', () => {
      store.startSession('sess-2');
      store.endSession('sess-2');

      const session = store.getSession('sess-2');
      expect(session!.ended_at).toBeDefined();
      expect(session!.ended_at).not.toBeNull();
    });

    it('should get a session by id', () => {
      store.startSession('sess-3', 'proj');
      const session = store.getSession('sess-3');
      expect(session).toBeDefined();
      expect(session!.id).toBe('sess-3');
    });

    it('should return undefined for non-existent session', () => {
      const session = store.getSession('nonexistent');
      expect(session).toBeUndefined();
    });

    it('should handle duplicate session start gracefully (INSERT OR IGNORE)', () => {
      store.startSession('dup-sess', 'proj');
      store.startSession('dup-sess', 'other-proj');

      const session = store.getSession('dup-sess');
      // Original project should be preserved due to INSERT OR IGNORE
      expect(session!.project).toBe('proj');
    });

    it('should update session counts', () => {
      store.startSession('count-sess');
      store.updateSessionCounts('count-sess', 5, 2, 10);

      const session = store.getSession('count-sess');
      expect(session!.edit_count).toBe(5);
      expect(session!.corrections_count).toBe(2);
      expect(session!.prompts_count).toBe(10);
    });

    it('should accumulate session counts', () => {
      store.startSession('accum-sess');
      store.updateSessionCounts('accum-sess', 3, 1, 5);
      store.updateSessionCounts('accum-sess', 2, 1, 3);

      const session = store.getSession('accum-sess');
      expect(session!.edit_count).toBe(5);
      expect(session!.corrections_count).toBe(2);
      expect(session!.prompts_count).toBe(8);
    });

    it('should get recent sessions', () => {
      store.startSession('recent-1');
      store.startSession('recent-2');
      store.startSession('recent-3');

      const recent = store.getRecentSessions(2);
      expect(recent).toHaveLength(2);
    });
  });
});
