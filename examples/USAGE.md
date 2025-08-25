Schema-only generation (canonical Power BI theme JSON)

```powershell
node scripts/generateTheme.js examples/palette.json out/theme.schema.json --visuals --out-dir out
```

Produces:
- out/theme.schema.json (canonical Power BI theme JSON suitable for import into Power BI)


Theme + helpers (semantic tokens + CSS variables)

```powershell
node scripts/generateTheme.js examples/palette.json out/theme.schema.json --visuals --semantic --css --out-dir out
```

Produces:
- out/theme.schema.json (canonical Power BI theme JSON)
- out/semantic.tokens.json (semantic token map)
- out/theme.vars.css (CSS variables)

Notes:
- Helper files are written separately so the main theme JSON remains strictly schema-compliant.
- Use `node scripts/validateSchema.js out/theme.schema.json` to validate the generated theme against the stored schema in `tools/reportThemeSchema.json`.
