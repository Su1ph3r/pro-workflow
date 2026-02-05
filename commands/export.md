Export learnings to a JSON file for backup or sharing.

## Usage
Export all learnings to a file.

## Options
- **project**: Filter by project name
- **include-sessions**: Include session analytics data

## Steps
1. Load the export module from `pro-workflow`
2. Ask the user for export path (default: `./pro-workflow-export.json`)
3. Ask if they want to filter by project or include sessions
4. Run `exportToFile(db, filePath, options)`
5. Report number of learnings exported

## Example
```
Exported 42 learnings to ./pro-workflow-export.json
```
