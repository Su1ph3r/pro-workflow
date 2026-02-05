export { initializeDatabase, getDefaultDbPath, ensureDbDir } from './db/index';
export { createStore, Learning, Session, Store } from './db/store';
export {
  searchLearnings,
  searchByCategory,
  getRelatedLearnings,
  getMostAppliedLearnings,
  getRecentLearnings,
  SearchResult,
  SearchOptions,
} from './search/fts';
export {
  ensureMigrationsTable,
  getAppliedMigrations,
  getMigrationFiles,
  runMigrations,
  getMigrationStatus,
  MigrationRecord,
  MigrationStatus,
} from './db/migrations';
export {
  exportLearnings,
  exportToFile,
  importLearnings,
  importFromFile,
  ExportData,
  ExportOptions,
  ImportOptions,
  ImportResult,
} from './export';
export {
  checkDatabase,
  checkMigrations,
  checkDistFiles,
  checkFtsIntegrity,
  runDiagnostics,
  CheckStatus,
  CheckResult,
  DiagnosticsReport,
} from './doctor';
