Run pro-workflow health diagnostics.

Check database connectivity, table structure, migration status, FTS index integrity, and dist file presence.

## Steps
1. Load the doctor module from `pro-workflow`
2. Run `runDiagnostics()` to check all systems
3. Display results grouped by status (errors first, then warnings, then OK)
4. If errors are found, suggest remediation steps

## Example Output
```
Pro-Workflow Health Check
========================
[OK] Database: Database OK
[OK] Migrations: All 1 migration(s) applied
[OK] Dist Files: All dist files present
[OK] FTS Integrity: FTS index OK (42 entries)

Summary: 4 OK, 0 warnings, 0 errors
```
