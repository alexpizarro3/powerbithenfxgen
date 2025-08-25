const swatches = document.getElementById('swatches');
const downloadBtn = document.getElementById('downloadTheme');

const palette = {
  name: 'Incredible Fusion',
  colors: ['#0b6efd','#0fcfdf','#7b61ff','#ff7ab6','#ffd166','#06d6a0','#ef476f'],
  background: '#ffffff',
  foreground: '#0f172a',
  tableAccent: '#0b6efd'
};

function renderSwatches() {
  swatches.innerHTML = '';
  palette.colors.forEach(c => {
    const d = document.createElement('div');
    d.className = 'sw';
    d.style.background = c;
    swatches.appendChild(d);
  });
}

function themeFromPalette() {
  return {
    name: palette.name,
    dataColors: palette.colors,
    background: palette.background,
    foreground: palette.foreground,
    tableAccent: palette.tableAccent
  };
}

downloadBtn.addEventListener('click', () => {
  const theme = themeFromPalette();
  const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'theme.preview.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

renderSwatches();
