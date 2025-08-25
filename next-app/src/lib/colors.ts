import chroma from 'chroma-js';

export interface Color {
  hex: string;
  locked: boolean;
  id: string;
}

export interface PowerBITheme {
  name: string;
  dataColors: string[];
  background: string;
  foreground: string;
  tableAccent: string;
  visualStyles?: {
    "*": {
      "*": {
        [key: string]: any;
      };
    };
  };
}

export interface SemanticTokens {
  primary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  foreground: string;
  muted: string;
}

/**
 * Generates a random hex color
 */
export function generateRandomColor(): string {
  return chroma.random().hex();
}

/**
 * Generates a palette of random colors
 */
export function generateRandomPalette(count: number = 8): Color[] {
  return Array.from({ length: count }, (_, index) => ({
    hex: generateRandomColor(),
    locked: false,
    id: `color-${index}-${Date.now()}`
  }));
}

/**
 * Validates if a color is a valid hex color
 */
export function isValidHexColor(color: string): boolean {
  try {
    chroma(color);
    return true;
  } catch {
    return false;
  }
}

/**
 * Converts hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const color = chroma(hex);
  const [r, g, b] = color.rgb();
  return { r, g, b };
}

/**
 * Converts hex color to HSL
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const color = chroma(hex);
  const [h, s, l] = color.hsl();
  return { 
    h: isNaN(h) ? 0 : h, 
    s: s * 100, 
    l: l * 100 
  };
}

/**
 * Gets the contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  return chroma.contrast(color1, color2);
}

/**
 * Determines if a color is light or dark
 */
export function isLightColor(color: string): boolean {
  return chroma(color).luminance() > 0.5;
}

/**
 * Generates complementary colors
 */
export function generateComplementary(baseColor: string): string[] {
  const base = chroma(baseColor);
  const complementary = base.set('hsl.h', (base.get('hsl.h') + 180) % 360);
  return [baseColor, complementary.hex()];
}

/**
 * Generates triadic colors
 */
export function generateTriadic(baseColor: string): string[] {
  const base = chroma(baseColor);
  const triadic1 = base.set('hsl.h', (base.get('hsl.h') + 120) % 360);
  const triadic2 = base.set('hsl.h', (base.get('hsl.h') + 240) % 360);
  return [baseColor, triadic1.hex(), triadic2.hex()];
}

/**
 * Generates analogous colors
 */
export function generateAnalogous(baseColor: string, count: number = 3): string[] {
  const base = chroma(baseColor);
  const colors = [baseColor];
  
  for (let i = 1; i < count; i++) {
    const offset = (i % 2 === 1 ? 1 : -1) * Math.ceil(i / 2) * 30;
    const analogous = base.set('hsl.h', (base.get('hsl.h') + offset) % 360);
    colors.push(analogous.hex());
  }
  
  return colors;
}

/**
 * Maps colors to semantic tokens
 */
export function mapToSemanticTokens(colors: Color[]): SemanticTokens {
  const palette = colors.map(c => c.hex);
  
  return {
    primary: palette[0] || '#3b82f6',
    accent: palette[1] || '#10b981',
    success: palette[2] || '#22c55e',
    warning: palette[3] || '#f59e0b',
    error: palette[4] || '#ef4444',
    background: '#ffffff',
    foreground: '#0f172a',
    muted: '#64748b',
  };
}

/**
 * Converts palette to Power BI theme JSON
 */
export function convertToPowerBITheme(
  colors: Color[], 
  themeName: string = 'Custom Theme'
): PowerBITheme {
  const dataColors = colors.map(c => c.hex.toUpperCase());
  
  return {
    name: themeName,
    dataColors,
    background: '#FFFFFF',
    foreground: '#0F172A',
    tableAccent: dataColors[0] || '#3B82F6',
  };
}

/**
 * Generates CSS variables from palette
 */
export function generateCSSVariables(colors: Color[], semanticTokens: SemanticTokens): string {
  const paletteVars = colors
    .map((color, index) => `  --color-${index + 1}: ${color.hex};`)
    .join('\n');
    
  const semanticVars = Object.entries(semanticTokens)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join('\n');
    
  return `:root {\n${paletteVars}\n${semanticVars}\n}`;
}

/**
 * Copies text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Downloads content as a file
 */
export function downloadFile(content: string, filename: string, contentType: string = 'application/json'): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
