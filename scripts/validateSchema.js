const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const schemaPath = path.join(__dirname, '..', 'tools', 'reportThemeSchema.json');
const themePath = process.argv[2] || path.join(__dirname, '..', 'out', 'theme.schema.json');

if (!fs.existsSync(schemaPath)) {
  console.error('Schema not found at', schemaPath);
  process.exit(2);
}
if (!fs.existsSync(themePath)) {
  console.error('Theme file not found at', themePath);
  process.exit(2);
}

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const theme = JSON.parse(fs.readFileSync(themePath, 'utf8'));

// Remove known non-schema helpers that the generator emits (semantic tokens,
// css variables, etc.) so validation focuses on the report theme object that
// Power BI expects.
const sanitizedTheme = JSON.parse(JSON.stringify(theme));
const removed = [];
['semanticTokens', 'cssVars'].forEach((k) => {
  if (Object.prototype.hasOwnProperty.call(sanitizedTheme, k)) {
    delete sanitizedTheme[k];
    removed.push(k);
  }
});
if (removed.length) {
  console.log('Removed helper properties before validation:', removed.join(', '));
}

// Some Microsoft schemas contain duplicate enum entries which causes Ajv to
// reject the schema during its own schema-validation step. Disable Ajv's
// validateSchema so we can compile the schema as-is and report validation
// results for generated themes.
const ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });
let validate;
try {
  validate = ajv.compile(schema);
} catch (err) {
  console.error('Failed to compile schema with Ajv:', err && err.message ? err.message : err);
  console.error('You can try cleaning duplicate enum entries in the schema or use a different schema version.');
  process.exit(3);
}

const valid = validate(sanitizedTheme);
if (valid) {
  console.log('Schema validation: PASS');
  process.exit(0);
} else {
  console.error('Schema validation: FAIL');
  console.error(validate.errors);
  process.exit(1);
}
