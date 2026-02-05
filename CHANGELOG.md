# Changelog

## [1.2.0] - 2026-02-05

### Added
- **Migration system**: Versioned SQL migrations with `_migrations` table tracking
- **Export/Import**: Backup and restore learnings as JSON files with duplicate detection
- **Doctor**: Health diagnostics for database, FTS integrity, migrations, and dist files
- **Commands**: `/doctor`, `/export`, `/import` slash commands
- **Testing**: Vitest test suite with 66 tests covering store, FTS search, migrations, export/import, and doctor
- **Linting**: ESLint with typescript-eslint for `src/`
- **Formatting**: Prettier with consistent code style
- **CI**: OS matrix testing (Ubuntu, macOS, Windows), lint, format, and test steps
- **`.gitattributes`**: LF line endings enforcement, binary marking for `.db` files
- **Agent frontmatter**: YAML `description` and `allowed-tools` for planner and reviewer agents

### Fixed
- FTS5 query parser now correctly handles `OR` and other FTS operators
- Database initialization skips `ensureDbDir()` for `:memory:` databases

## [1.1.0] - 2025-07-15

### Added
- `/commit`: Smart commit with quality gates, code review, and learning capture
- `/insights`: Session analytics, learning patterns, correction trends, productivity metrics
- Agent teams: Coordinate multiple Claude Code sessions with shared task lists
- Custom subagents: Project or user-level subagents with custom tools and hooks
- Adaptive thinking: Opus 4.6 calibrates reasoning depth per task
- Context compaction: Auto-compaction with PreCompact hooks
- Updated model selection: Haiku 4.5, Sonnet 4.5, Opus 4.6

## [1.0.0] - 2025-06-30

### Added
- Persistent SQLite storage for learnings at `~/.pro-workflow/data.db`
- FTS5 full-text search with BM25 ranking
- Learning CRUD operations via stateless store factory
- Session analytics tracking
- `/learn`, `/search`, `/list`, `/wrap-up`, `/learn-rule`, `/parallel` commands
- Hooks for edit tracking, quality gates, session lifecycle
- Planner and reviewer agents
- CI workflow with Node.js 18/20/22 matrix
