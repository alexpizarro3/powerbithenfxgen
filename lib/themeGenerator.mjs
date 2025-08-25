function mapSemanticTokens(colors) {
  return {
    primary: colors[0] || '#0b6efd',
    accent: colors[1] || '#0fcfdf',
    success: colors[2] || '#06d6a0',
    warning: colors[3] || '#ffd166',
    info: colors[4] || '#7b61ff',
    neutral: colors[5] || '#6b7280',
    danger: colors[6] || '#ef476f'
  };
}

export function paletteToPowerBITheme(palette, opts = {}) {
  const theme = {
    name: palette.name || 'Generated theme',
    dataColors: (palette.colors || []).slice(0, 20),
    background: palette.background || '#ffffff',
    foreground: palette.foreground || '#000000',
    tableAccent: palette.tableAccent || (palette.colors && palette.colors[0]) || '#0078d4'
  };
  // Compute semantic tokens locally for building visualStyles, but do not
  // attach helper properties to the returned theme object. This keeps the
  // output strictly conforming to the Power BI report theme schema.
  const tokens = mapSemanticTokens(palette.colors || []);
  if (opts.includeVisuals) {
    const t = key => (tokens[key] || key);
    // Use the Power BI visualStyles schema: each visual has a '*' style containing
    // card names (legend, dataPoint, valueAxis, etc.) which map to arrays of property objects.
    theme.visualStyles = {
      // global text and label defaults
      '*': {
        '*': {
          'title': [{ 'color': { 'solid': { 'color': tokens.primary } } }],
          'label': [{ 'color': { 'solid': { 'color': tokens.neutral } } }]
        }
      },
      // charts
      'barChart': {
        '*': {
          'dataPoint': [{ 'fill': { 'solid': { 'color': t('accent') } } }],
          'categoryAxis': [{ 'labelColor': { 'solid': { 'color': t('neutral') } } }],
          'valueAxis': [{ 'labelColor': { 'solid': { 'color': t('neutral') } } }]
        }
      },
      'columnChart': {
        '*': {
          'dataPoint': [{ 'fill': { 'solid': { 'color': t('primary') } } }],
          'categoryAxis': [{ 'labelColor': { 'solid': { 'color': t('neutral') } } }]
        }
      },
      'lineChart': {
        '*': {
          'lines': [{ 'stroke': { 'solid': { 'color': t('primary') } } }],
          'markers': [{ 'fill': { 'solid': { 'color': t('accent') } } }]
        }
      },
      'areaChart': {
        '*': {
          'dataPoint': [{ 'fill': { 'solid': { 'color': t('accent') } } }],
          'lines': [{ 'stroke': { 'solid': { 'color': t('primary') } } }]
        }
      },
      'comboChart': {
        '*': {
          'primarySeries': [{ 'fill': { 'solid': { 'color': t('primary') } } }],
          'secondarySeries': [{ 'fill': { 'solid': { 'color': t('accent') } } }]
        }
      },
      'scatterChart': {
        '*': {
          'bubbles': [{ 'fill': { 'solid': { 'color': t('accent') } } }],
          'marker': [{ 'outline': { 'solid': { 'color': t('neutral') } } }]
        }
      },
      'pieChart': {
        '*': {
          'slices': [{ 'fill': { 'solid': { 'color': t('accent') } } }]
        }
      },
      'donutChart': {
        '*': {
          'slices': [{ 'fill': { 'solid': { 'color': t('accent') } } }]
        }
      },
      // cards and tables
      'card': { '*': { 'title': [{ 'color': { 'solid': { 'color': t('primary') } } }], 'label': [{ 'color': { 'solid': { 'color': t('neutral') } } }] } },
      'multiRowCard': { '*': { 'title': [{ 'color': { 'solid': { 'color': t('primary') } } }], 'label': [{ 'color': { 'solid': { 'color': t('neutral') } } }] } },
      'table': { '*': { 'header': [{ 'background': { 'solid': { 'color': t('primary') } } }], 'rows': [{ 'rowStripeColor': { 'solid': { 'color': t('neutral') } } }], 'grid': [{ 'color': { 'solid': { 'color': t('neutral') } } }] } },
      'matrix': { '*': { 'header': [{ 'background': { 'solid': { 'color': t('primary') } } }], 'rows': [{ 'rowStripeColor': { 'solid': { 'color': t('neutral') } } }] } },
      'slicer': { '*': { 'selection': [{ 'fill': { 'solid': { 'color': t('accent') } } }], 'header': [{ 'labelColor': { 'solid': { 'color': t('neutral') } } }] } },
      'timeline': { '*': { 'item': [{ 'fill': { 'solid': { 'color': t('accent') } } }], 'range': [{ 'fill': { 'solid': { 'color': t('primary') } } }] } },
      // fallback container settings
      'visualContainer': { '*': { 'background': [{ 'solid': { 'color': palette.background || '#ffffff' } }], 'foreground': [{ 'solid': { 'color': palette.foreground || '#000000' } }] } }
    };
  }
  return theme;
}

export function paletteToCSSVars(palette) {
  const colors = palette.colors || [];
  const tokens = mapSemanticTokens(colors);
  const lines = [];
  lines.push(':root {');
  colors.forEach((c, i) => lines.push(`  --color-${i + 1}: ${c};`));
  Object.keys(tokens).forEach(k => lines.push(`  --${k}: ${tokens[k]};`));
  lines.push(`  --background: ${palette.background || '#ffffff'};`);
  lines.push(`  --foreground: ${palette.foreground || '#000000'};`);
  lines.push('}');
  return lines.join('\n');
}

export function mergeMappingIntoTheme(theme, mapping) {
  if (!mapping) return theme;
  theme.visualStyles = theme.visualStyles || {};
  const tokens = theme.semanticTokens || mapSemanticTokens(theme.dataColors || []);
  Object.keys(mapping).forEach(visKey => {
    const props = mapping[visKey];
    theme.visualStyles[visKey] = theme.visualStyles[visKey] || {};
    theme.visualStyles[visKey]['*'] = theme.visualStyles[visKey]['*'] || {};
    // props is expected to be an object mapping cardName -> { propName: tokenOrColor }
    Object.keys(props).forEach(cardName => {
      const cardProps = props[cardName];
      const propObj = {};
      Object.keys(cardProps).forEach(propName => {
        const value = cardProps[propName];
        const color = (tokens[value] && tokens[value]) || value;
        // keep the schema shape: cardName: [{ <propName>: { solid: { color } } }]
        propObj[propName] = { solid: { color } };
      });
      theme.visualStyles[visKey]['*'][cardName] = theme.visualStyles[visKey]['*'][cardName] || [];
      theme.visualStyles[visKey]['*'][cardName].push(propObj);
    });
  });
  return theme;
}
