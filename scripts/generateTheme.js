const fs = require('fs');
const path = require('path');
const gen = require('../lib/themeGenerator');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJSON(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
}

function writeText(p, txt) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, txt, 'utf8');
}

// use shared generator utilities
const { mapSemanticTokens, paletteToPowerBITheme, paletteToCSSVars, mergeMappingIntoTheme } = gen;

function parseFlags(argv) {
  const flags = {};
  argv.forEach((a, i) => {
    if (a === '--semantic') flags.semantic = true;
    if (a === '--css') flags.css = true;
  if (a === '--visuals') flags.visuals = true;
  if (a === '--mapping' && argv[i + 1]) flags.mapping = argv[i + 1];
    if (a === '--out-dir' && argv[i + 1]) flags.outDir = argv[i + 1];
  });
  return flags;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node generateTheme.js <palette.json> <out.theme.json> [--semantic] [--css] [--out-dir <dir>]');
    process.exit(2);
  }

  const input = args[0];
  const out = args[1];
  const flags = parseFlags(args.slice(2));
  const outDir = flags.outDir || path.dirname(out) || 'out';

  const palette = readJSON(input);
  const theme = paletteToPowerBITheme(palette, { includeSemantic: flags.semantic, includeVisuals: flags.visuals });
  // visualStyles are generated inside paletteToPowerBITheme when includeVisuals=true

  // If a mapping file is provided, merge its mappings into visualStyles.
  if (flags.mapping) {
    try {
      const mapPath = path.resolve(flags.mapping);
      const mapping = readJSON(mapPath);
      mergeMappingIntoTheme(theme, mapping);
      console.log('Merged visual mapping from', flags.mapping);
    } catch (e) {
      console.error('Failed to read mapping file:', e.message);
    }
  }
  // If a semantic tokens file is requested, write it separately and remove
  // the helper from the theme object so the theme JSON remains schema-clean.
  if (flags.semantic) {
    const semanticPath = path.join(outDir, 'semantic.tokens.json');
    const tokens = theme.semanticTokens || mapSemanticTokens(palette.colors);
    writeJSON(semanticPath, tokens);
    // remove helper property from theme before writing
    if (Object.prototype.hasOwnProperty.call(theme, 'semanticTokens')) delete theme.semanticTokens;
    console.log('Wrote semantic tokens to', semanticPath);
  }

  // CSS variables are written to a separate file when requested.
  if (flags.css) {
    const css = paletteToCSSVars(palette);
    const cssPath = path.join(outDir, 'theme.vars.css');
    writeText(cssPath, css);
    console.log('Wrote CSS variables to', cssPath);
  }

  // Finally write the canonical Power BI theme JSON (without helpers).
  writeJSON(out, theme);
  console.log('Wrote Power BI theme to', out);
}

if (require.main === module) main();
