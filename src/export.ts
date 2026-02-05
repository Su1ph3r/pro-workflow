import Database from 'better-sqlite3';
import * as fs from 'fs';
import { Learning, Session } from './db/store';

export interface ExportData {
  version: number;
  exported_at: string;
  learnings: Learning[];
  sessions?: Session[];
}

export interface ExportOptions {
  project?: string;
  includeSessions?: boolean;
}

export interface ImportOptions {
  allowDuplicates?: boolean;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export function exportLearnings(db: Database.Database, options: ExportOptions = {}): ExportData {
  const { project, includeSessions = false } = options;

  let learnings: Learning[];
  if (project) {
    const stmt = db.prepare(
      'SELECT * FROM learnings WHERE project = ? OR project IS NULL ORDER BY created_at DESC',
    );
    learnings = stmt.all(project) as Learning[];
  } else {
    const stmt = db.prepare('SELECT * FROM learnings ORDER BY created_at DESC');
    learnings = stmt.all() as Learning[];
  }

  const data: ExportData = {
    version: 1,
    exported_at: new Date().toISOString(),
    learnings,
  };

  if (includeSessions) {
    const sessionStmt = db.prepare('SELECT * FROM sessions ORDER BY started_at DESC');
    data.sessions = sessionStmt.all() as Session[];
  }

  return data;
}

export function exportToFile(
  db: Database.Database,
  filePath: string,
  options: ExportOptions = {},
): void {
  const data = exportLearnings(db, options);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export function importLearnings(
  db: Database.Database,
  data: ExportData,
  options: ImportOptions = {},
): ImportResult {
  const { allowDuplicates = false } = options;

  if (!data || typeof data.version !== 'number' || !Array.isArray(data.learnings)) {
    return { imported: 0, skipped: 0, errors: ['Invalid export data format'] };
  }

  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  const findDuplicate = db.prepare(
    'SELECT id FROM learnings WHERE category = ? AND rule = ? LIMIT 1',
  );

  const insertLearning = db.prepare(`
    INSERT INTO learnings (created_at, project, category, rule, mistake, correction, times_applied)
    VALUES (@created_at, @project, @category, @rule, @mistake, @correction, @times_applied)
  `);

  const importAll = db.transaction(() => {
    for (const learning of data.learnings) {
      if (!learning.category || !learning.rule) {
        result.errors.push('Skipped invalid learning: missing category or rule');
        continue;
      }

      if (!allowDuplicates) {
        const existing = findDuplicate.get(learning.category, learning.rule);
        if (existing) {
          result.skipped++;
          continue;
        }
      }

      insertLearning.run({
        created_at: learning.created_at || new Date().toISOString(),
        project: learning.project ?? null,
        category: learning.category,
        rule: learning.rule,
        mistake: learning.mistake ?? null,
        correction: learning.correction ?? null,
        times_applied: learning.times_applied ?? 0,
      });
      result.imported++;
    }
  });

  importAll();
  return result;
}

export function importFromFile(
  db: Database.Database,
  filePath: string,
  options: ImportOptions = {},
): ImportResult {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw) as ExportData;
  return importLearnings(db, data, options);
}
