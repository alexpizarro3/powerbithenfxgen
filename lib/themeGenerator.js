// Re-export functions from ESM module to keep CommonJS consumers working.
const { createRequire } = require('module');
const requireFrom = createRequire(__filename);
const esm = requireFrom('./themeGenerator.mjs');
module.exports = esm;
