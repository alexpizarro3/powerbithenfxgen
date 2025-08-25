const assert = require('assert');
const { paletteToPowerBITheme } = require('../lib/themeGenerator.js');

function testVisualStylesPresence() {
  const palette = require('../examples/palette.json');
  const theme = paletteToPowerBITheme(palette, { includeSemantic: true, includeVisuals: true });
  assert.ok(theme, 'theme should be returned');
  assert.ok(theme.visualStyles, 'visualStyles must exist when includeVisuals=true');
  const keys = ['barChart','columnChart','lineChart','table','card','slicer','pieChart'];
  keys.forEach(k => assert.ok(theme.visualStyles[k], `visualStyles should include ${k}`));
  console.log('OK - visualStyles presence test passed');
}

try {
  testVisualStylesPresence();
} catch (e) {
  console.error('Test failed:', e && e.message ? e.message : e);
  process.exit(1);
}
