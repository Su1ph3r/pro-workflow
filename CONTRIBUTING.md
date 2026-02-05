# Contributing to Pro-Workflow

## Development Setup

```bash
git clone https://github.com/rohitg00/pro-workflow.git
cd pro-workflow
npm install
npm run build
npm test
```

## Code Standards

- **TypeScript**: Strict mode enabled (`strict: true`)
- **Linting**: ESLint with typescript-eslint (`npm run lint`)
- **Formatting**: Prettier (`npm run format:check`)
- **Testing**: Vitest with `pool: 'forks'` for native module compatibility (`npm test`)
- **All tests must pass before merging**

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run build` | Compile TypeScript |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Check for lint errors |
| `npm run lint:fix` | Auto-fix lint errors |
| `npm run format` | Format source files |
| `npm run format:check` | Check formatting |

## Adding Migrations

1. Create a new `.sql` file in `src/db/migrations/` with a numeric prefix (e.g., `002_add_tags.sql`)
2. Use `IF NOT EXISTS` for all `CREATE` statements to ensure backward compatibility
3. Add corresponding tests in `tests/db/migrations.test.ts`
4. Run `npm test` to verify

## Adding Commands

1. Create a markdown file in `commands/` (e.g., `commands/my-command.md`)
2. Describe the command's purpose, steps, and example output
3. Update `README.md` commands table

## Adding Hooks

1. Add hook configuration to `hooks/hooks.json`
2. Create the hook script in `scripts/`
3. Document the hook in `README.md`

## Commit Messages

Use conventional commits:

```
feat: add export command
fix: handle null project in search
chore: update dependencies
docs: add migration guide
test: add FTS search edge cases
```

## Pull Request Guidelines

1. Create a feature branch from `main`
2. Ensure all checks pass: `npm run lint && npm run format:check && npm test && npm run build`
3. Write tests for new functionality
4. Update documentation if adding features
5. Keep PRs focused — one feature or fix per PR
