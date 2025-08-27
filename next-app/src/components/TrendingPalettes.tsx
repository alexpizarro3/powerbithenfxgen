'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { usePaletteStore } from '@/store/palette';
import { generateRandomPalette, type Color } from '@/lib/colors';
import chroma from 'chroma-js';

const PRESET_PALETTES: string[][] = [
  ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'], // Ocean Sunset
  ['#0D1B2A', '#1B263B', '#415A77', '#778DA9', '#E0E1DD'], // Deep Blue
  ['#F72585', '#7209B7', '#3A0CA3', '#4361EE', '#4CC9F0'], // Neon Pop
  ['#22223B', '#4A4E69', '#9A8C98', '#C9ADA7', '#F2E9E4'], // Dusty Rose
  ['#2B2D42', '#8D99AE', '#EDF2F4', '#EF233C', '#D90429'], // Minimal Red
  ['#073B4C', '#118AB2', '#06D6A0', '#FFD166', '#EF476F'], // Happy Day
  ['#0B132B', '#1C2541', '#3A506B', '#5BC0BE', '#6FFFE9'], // Cool Night
  ['#F6BD60', '#F7EDE2', '#F5CAC3', '#84A59D', '#F28482'], // Pastel Warm
];

type TrendingItem = {
  id: string;
  title: string;
  author?: string;
  colors: string[];
  tags?: string[];
};

function toColors(hexes: string[]): Color[] {
  return hexes.map((hex, i) => ({ hex, locked: false, id: `preset-${i}-${Date.now()}` }));
}

export function TrendingPalettes() {
  const { setColors, setViewMode } = usePaletteStore();
  const [items, setItems] = React.useState<TrendingItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [category, setCategory] = React.useState<string>('all');
  const [provider, setProvider] = React.useState<string | null>(null);

  const CATEGORIES: { id: string; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'dark', label: 'Dark' },
    { id: 'light', label: 'Light' },
    { id: 'warm', label: 'Warm' },
    { id: 'cool', label: 'Cool' },
    { id: 'blues', label: 'Blues' },
    { id: 'reds', label: 'Reds' },
    { id: 'greens', label: 'Greens' },
    { id: 'pastels', label: 'Pastels' },
    { id: 'neutrals', label: 'Neutrals' },
    { id: 'high-contrast', label: 'High Contrast' },
  ];

  function categorize(hexes: string[]): string[] {
    try {
      const hsl = hexes.map((h) => chroma(h).hsl()); // [h,s,l]
      const n = Math.max(1, hsl.length);

      // Averages
      const avg = hsl.reduce(
        (acc, [h, s, l]) => {
          const hh = isNaN(h) ? 0 : ((h % 360) + 360) % 360;
          return {
            h: acc.h + hh,
            s: acc.s + (isNaN(s) ? 0 : s),
            l: acc.l + (isNaN(l) ? 0 : l),
          };
        },
        { h: 0, s: 0, l: 0 }
      );
      const meanH = (avg.h / n) % 360;
      const meanS = avg.s / n;
      const meanL = avg.l / n;

      // Luminance spread for contrast
      const lum = hexes.map((h) => chroma(h).luminance());
      const contrastSpread = Math.max(...lum) - Math.min(...lum);

      const tags: string[] = [];

      // Dark/Light by average lightness
      if (meanL <= 0.38) tags.push('dark');
      if (meanL >= 0.62) tags.push('light');

      // Warm/Cool by mean hue bucket
      const isWarm = meanH >= 330 || meanH < 70;
      const isCool = meanH >= 90 && meanH <= 300;
      if (isWarm) tags.push('warm');
      if (isCool) tags.push('cool');

      // Count-based families to avoid average hue dilution
      const thresh = Math.max(2, Math.ceil(n * 0.4));
      const redsCount = hsl.filter(([h]) => {
        const hh = isNaN(h) ? 0 : ((h % 360) + 360) % 360;
        return (hh < 25 || hh >= 345);
      }).length;
      const bluesCount = hsl.filter(([h]) => {
        const hh = isNaN(h) ? 0 : ((h % 360) + 360) % 360;
        return hh >= 190 && hh < 265;
      }).length;
      const greensCount = hsl.filter(([h]) => {
        const hh = isNaN(h) ? 0 : ((h % 360) + 360) % 360;
        return hh >= 85 && hh < 165;
      }).length;
      if (redsCount >= thresh) tags.push('reds');
      if (bluesCount >= thresh) tags.push('blues');
      if (greensCount >= thresh) tags.push('greens');

      // Pastels: enough colors with low saturation and high lightness
      const pastelCount = hsl.filter(([, s, l]) => (s || 0) <= 0.5 && (l || 0) >= 0.75).length;
      if (pastelCount >= thresh) tags.push('pastels');

      // Neutrals: enough low-saturation colors or low overall sat + modest hue variance
      const neutralCount = hsl.filter(([, s]) => (s || 0) < 0.22).length;
      const hueVar = hsl
        .map(([h]) => ((isNaN(h) ? 0 : ((h % 360) + 360) % 360) - meanH + 540) % 360 - 180)
        .reduce((acc, d) => acc + Math.abs(d), 0) / n;
      if (neutralCount >= thresh || (meanS < 0.25 && hueVar < 60)) tags.push('neutrals');

      // High contrast from luminance spread
      if (contrastSpread >= 0.45) tags.push('high-contrast');

      return Array.from(new Set(tags));
    } catch {
      return [];
    }
  }

  const load = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/trending', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data?.provider) setProvider(String(data.provider));
      const list: TrendingItem[] = (data?.palettes || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        author: p.author,
        colors: p.colors,
      }));
      const tagged = list.map((it) => ({ ...it, tags: categorize(it.colors) }));
      setItems(tagged);
    } catch {
      setError('Using fallback palettes');
  setProvider('presets');
  setItems(
        PRESET_PALETTES.map((colors, i) => ({ id: `preset-${i}`, title: 'Preset', colors }))
          .map((it) => ({ ...it, tags: categorize(it.colors) }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Trending Palettes</h3>
          {provider && (
            <span className="text-xs px-2 py-0.5 rounded-full border border-gray-200 bg-white text-gray-700">
              Source: {provider === 'colourlovers' ? 'COLOURlovers' : provider === 'lospec' ? 'Lospec' : 'Presets'}
            </span>
          )}
        </div>
      </div>
      {loading && (
        <div className="text-sm text-gray-500">Loading trending palettes…</div>
      )}
      {error && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">{error}</div>
      )}
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={load}
          className="text-sm px-3 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-colors ${
              category === c.id
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
            aria-pressed={category === c.id}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(() => {
          const filtered = (items ?? []).filter(it => category === 'all' ? true : it.tags?.includes(category));
          if (filtered.length === 0 && !loading) {
            return (
              <div className="col-span-full text-sm text-gray-500 border border-dashed border-gray-200 rounded p-4 text-center">
                No palettes match “{CATEGORIES.find(c=>c.id===category)?.label}”. Try a different category.
              </div>
            );
          }
          return filtered.map((item, idx) => (
          <motion.button
            key={idx}
            onClick={() => {
              setColors(toColors(item.colors));
              setViewMode('palette');
              const el = document.getElementById('palette-editor');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              toast.success(`Applied ${item.title || 'palette'}`);
            }}
            className="group rounded-lg overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow transition-shadow text-left"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex h-16">
              {item.colors.map((hex) => (
                <div key={hex} className="flex-1" style={{ backgroundColor: hex }} />
              ))}
            </div>
            <div className="p-3 text-sm text-gray-600 flex items-center justify-between">
              <span className="truncate" title={item.title || 'Palette'}>
                {item.title || 'Palette'} {item.author ? `• ${item.author}` : ''}
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </div>
          </motion.button>
          ));
        })()}
      </div>
    </div>
  );
}
