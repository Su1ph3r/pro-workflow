Import learnings from a JSON export file.

## Usage
Import learnings from a previously exported file.

## Options
- **allow-duplicates**: Import even if category+rule already exists

## Steps
1. Load the import module from `pro-workflow`
2. Ask the user for the import file path
3. Ask if duplicates should be allowed
4. Run `importFromFile(db, filePath, options)`
5. Report: imported count, skipped duplicates, any errors

## Example
```
Import complete: 38 imported, 4 duplicates skipped, 0 errors
```
