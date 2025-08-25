## PBIX Theme Generator (palette -> Power BI JSON)

### Inspiration — sites to fuse

This project aims to fuse the best of two worlds: a world-class palette UX and a production-ready Power BI theme export flow.

- **Coolors** ([coolors.co](https://coolors.co)) — clean, fast palette exploration and gallery/strip views, keyboard-first interactions, polished micro-interactions, drag-to-reorder, and large visual previews.
- **Power BI Theme Generator examples / demo sites**  https://powerbithemegenerator.bibb.pro/ — Power BI–focused preview, export workflow that produces schema-compliant JSON, and a dashboard-style live preview that shows how palettes look in report components.

**Goal**: Merge Coolors' delightful palette UX (strip/gallery, micro-interactions, keyboard shortcuts) with a Power BI theme generator's export fidelity (JSON schema compliance, visual preview, PBIT guidance) so the same canonical generator drives both CLI and web exports.

---

### Key Features

- **Drag-to-reorder**: Easily rearrange colors in your palette.
- **Export Modal**: Generate schema-compliant Power BI theme JSON.
- **Onboarding Tooltip**: Guided walkthrough for new users.
- **Live Preview**: See how your palette looks in Power BI visuals.
- **Semantic Tokens**: Generate CSS variables and design tokens for web use.

---

### Visual Overview

#### Palette Editor

![Palette Editor Screenshot](path/to/palette-editor-screenshot.png)

#### Export Workflow

![Export Modal Screenshot](path/to/export-modal-screenshot.png)

#### Live Preview

![Live Preview Screenshot](path/to/live-preview-screenshot.png)

---

### Quick Usage

1. **Ensure Node.js is installed (>=12).**
2. **Basic run (schema-only output):**

   ```powershell
   node scripts/generateTheme.js examples/palette.json out/theme.powerbi.json
   ```

   This writes `out/theme.powerbi.json` containing only the canonical Power BI theme object (name, dataColors, background, foreground, tableAccent, and optional `visualStyles` when `--visuals` is used).

3. **Generate theme + helpers (semantic tokens & CSS vars):**

   ```powershell
   node scripts/generateTheme.js examples/palette.json out/theme.powerbi.json --semantic --css --out-dir out
   ```

   This will produce:
   - `out/theme.powerbi.json` - canonical Power BI theme JSON (no helper properties)
   - `out/semantic.tokens.json` - mapped semantic tokens (primary, accent, etc.)
   - `out/theme.vars.css` - CSS variables for web use

4. **Generate a richer Power BI theme with `visualStyles` (starter mappings):**

   ```powershell
   node scripts/generateTheme.js examples/palette.json out/theme.powerbi.json --visuals --semantic --out-dir out
   ```

---

### Prototype: Next.js Palette Editor

A minimal Next.js prototype was scaffolded under `next-app/`. To run it:

```powershell
cd next-app
npm install
npm run dev
```

#### Features

- **Palette Editor**: Drag-and-drop to reorder colors.
- **Export Buttons**: Download JSON and CSS files.
- **API Integration**: POST palettes to `/api/generate` for theme generation.

#### Screenshot

![Next.js Prototype Screenshot](path/to/nextjs-prototype-screenshot.png)

---

### Roadmap

- **Enhanced Visual Previews**: Add more Power BI visual examples.
- **Advanced Export Options**: Tailwind config, Figma tokens.
- **Improved Onboarding**: Interactive tutorials and tooltips.
- **Mobile Support**: Optimize for touch interactions.

---

### Notes

- Power BI themes are JSON objects with specific schema (dataColors, visuals, etc.). This generator creates a minimal theme focused on `dataColors` and a few global tokens.
- If you need advanced theme features (visual styles, conditional formatting), extend `scripts/generateTheme.js` to include the `visualStyles` section per Power BI theme schema.
- Programmatic PBIX generation is not supported by Microsoft; the common pattern is: generate theme JSON, apply in Power BI Desktop, then save a PBIT.
