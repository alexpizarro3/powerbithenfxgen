const fs = require('fs');
const path = require('path');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function validate(theme) {
  const errors = [];
  if (!theme.dataColors || !Array.isArray(theme.dataColors) || theme.dataColors.length === 0) {
    errors.push('dataColors must be a non-empty array');
  }
  if (!theme.background) errors.push('background is missing');
  if (!theme.foreground) errors.push('foreground is missing');
  // basic color format check
  theme.dataColors.forEach((c, i) => {
    if (!/^#([0-9a-fA-F]{6})$/.test(c)) errors.push(`dataColors[${i}] (${c}) is not a valid hex color`);
  });
  return errors;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node validateTheme.js <theme.json>');
    process.exit(2);
  }
  const theme = readJSON(args[0]);
  const errs = validate(theme);
  if (errs.length) {
    console.error('Validation failed:');
    errs.forEach(e => console.error(' -', e));
    process.exit(3);
  }
  console.log('Theme looks valid (basic checks passed).');
}

if (require.main === module) main();
