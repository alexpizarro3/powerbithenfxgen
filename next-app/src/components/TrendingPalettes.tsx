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
  const [notice, setNotice] = React.useState<string | null>(null);
  // New: query controls for server API (Lospec hidden; default to Colormind)
  const [source, setSource] = React.useState<'auto' | 'colourlovers' | 'lospec' | 'colormind'>('colormind');
  const [sort, setSort] = React.useState<string>('top');
  const [keywords, setKeywords] = React.useState('');
  const [hueOption, setHueOption] = React.useState('');
  const [tag, setTag] = React.useState('');
  const [colorNumber, setColorNumber] = React.useState<number | undefined>(undefined);
  const [page, setPage] = React.useState(1);
  // Colormind extras
  const [cmModel, setCmModel] = React.useState<string>('default');
  const [cmSeed, setCmSeed] = React.useState<string>(''); // comma: #rrggbb or N up to 5
  const [cmModels, setCmModels] = React.useState<string[] | null>(null);
  const [cmModelCustom, setCmModelCustom] = React.useState<string>('');
  const requestIdRef = React.useRef(0);
  const abortRef = React.useRef<AbortController | null>(null);

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

  // Generate a fun, deterministic name for a palette based on its colors and tags
  function generateCrazyName(hexes: string[]): string {
    const tags = categorize(hexes);
    const seedStr = hexes.join('').toLowerCase();
    const hashStr = (s: string) => {
      let h = 5381 >>> 0;
      for (let i = 0; i < s.length; i++) h = (((h << 5) + h) + s.charCodeAt(i)) >>> 0;
      return h >>> 0;
    };
    const seed = hashStr(seedStr);
    const pick = <T,>(arr: T[], salt = 0): T => arr[Math.abs((seed + salt) % arr.length)];

    // Word banks by theme
    const words = {
      warmAdj: ['Solar', 'Molten', 'Saffron', 'Ember', 'Citrus', 'Amber', 'Spicy', 'Sunset', 'Golden', 'Magma'],
      warmNoun: ['Blaze', 'Ember', 'Canyon', 'Phoenix', 'Mirage', 'Hearth', 'Inferno', 'Spice', 'Cinder', 'Sahara'],
      coolAdj: ['Arctic', 'Azure', 'Cerulean', 'Icy', 'Minty', 'Electric', 'Oceanic', 'Polar', 'Neon', 'Glacial'],
      coolNoun: ['Glacier', 'Lagoon', 'Aurora', 'Wave', 'Nebula', 'Tundra', 'Reef', 'Breeze', 'Fjord', 'Nightfall'],
      pastelAdj: ['Powdered', 'Cotton', 'Dreamy', 'Soft', 'Blushing', 'Marshmallow', 'Cloudy', 'Milky', 'Whispering', 'Velvet'],
      pastelNoun: ['Macaron', 'Sorbet', 'Petal', 'Daydream', 'Confetti', 'Blossom', 'Taffy', 'Cupcake', 'Lullaby', 'Peony'],
      darkAdj: ['Midnight', 'Obsidian', 'Shadow', 'Nocturnal', 'Smoky', 'Velvet', 'Eclipse', 'Dusky', 'Onyx', 'Ink'],
      darkNoun: ['Abyss', 'Phantom', 'Raven', 'Night', 'Void', 'Noir', 'Crypt', 'Gloom', 'Grimoire', 'Embrace'],
      lightAdj: ['Luminous', 'Ivory', 'Porcelain', 'Silken', 'Frosted', 'Halo', 'Feathered', 'Cloud', 'Pearled', 'Opal'],
      lightNoun: ['Dawn', 'Feather', 'Snow', 'Halo', 'Gossamer', 'Breeze', 'Glow', 'Skylark', 'Mist', 'Aura'],
      neutralAdj: ['Dusty', 'Stone', 'Greige', 'Taupe', 'Faded', 'Linen', 'Chalk', 'Muted', 'Earthen', 'Canvas'],
      neutralNoun: ['Sand', 'Pebble', 'Paper', 'Drift', 'Clay', 'Canvas', 'Grain', 'Plaster', 'Birch', 'Wool'],
      redAdj: ['Crimson', 'Ruby', 'Chili', 'Garnet', 'Scarlet', 'Cherry', 'Sanguine', 'Vermilion'],
      redNoun: ['Ember', 'Pepper', 'Garnet', 'Rose', 'Flare', 'Poppy', 'Pulse'],
      blueAdj: ['Sapphire', 'Cobalt', 'Indigo', 'Azure', 'Navy', 'Ultramarine', 'Glacial'],
      blueNoun: ['Sea', 'Glacier', 'Sky', 'Abyss', 'Tide', 'Current', 'Deep'],
      greenAdj: ['Jade', 'Mossy', 'Viridian', 'Mint', 'Olive', 'Emerald', 'Forest'],
      greenNoun: ['Meadow', 'Fern', 'Grove', 'Canopy', 'Moss', 'Thicket', 'Bloom'],
      contrastExtra: ['Turbo', 'Deluxe', 'Ultra', 'Hyper', 'Punch', 'XR'],
      cyberExtra: ['Protocol', 'Circuit', 'Neon', 'Pulse', 'Matrix'],
      pastelExtra: ['Sorbet', 'Macaron', 'Parfait', 'Cream'],
    };

    // Decide a theme using tags priority
    const has = (t: string) => tags.includes(t);
    let theme: 'pastel' | 'red' | 'blue' | 'green' | 'dark' | 'light' | 'neutral' | 'warm' | 'cool' = 'cool';
    if (has('pastels')) theme = 'pastel';
    else if (has('reds')) theme = 'red';
    else if (has('blues')) theme = 'blue';
    else if (has('greens')) theme = 'green';
    else if (has('dark')) theme = 'dark';
    else if (has('light')) theme = 'light';
    else if (has('neutrals')) theme = 'neutral';
    else if (has('warm')) theme = 'warm';
    else theme = 'cool';

    let adjPool: string[] = [];
    let nounPool: string[] = [];
    switch (theme) {
      case 'pastel':
        adjPool = words.pastelAdj; nounPool = words.pastelNoun; break;
      case 'red':
        adjPool = words.redAdj.concat(words.warmAdj); nounPool = words.redNoun.concat(words.warmNoun); break;
      case 'blue':
        adjPool = words.blueAdj.concat(words.coolAdj); nounPool = words.blueNoun.concat(words.coolNoun); break;
      case 'green':
        adjPool = words.greenAdj.concat(words.coolAdj); nounPool = words.greenNoun.concat(words.coolNoun); break;
      case 'dark':
        adjPool = words.darkAdj; nounPool = words.darkNoun; break;
      case 'light':
        adjPool = words.lightAdj; nounPool = words.lightNoun; break;
      case 'neutral':
        adjPool = words.neutralAdj; nounPool = words.neutralNoun; break;
      case 'warm':
        adjPool = words.warmAdj; nounPool = words.warmNoun; break;
      default:
        adjPool = words.coolAdj; nounPool = words.coolNoun; break;
    }

    const adj = pick(adjPool, 17);
    const noun = pick(nounPool, 91);
    let name = `${adj} ${noun}`;

    // Optional themed suffixes for extra flair, deterministic
    if (has('pastels') && (seed % 3 === 0)) name += ' ' + pick(words.pastelExtra, 7);
    if (has('high-contrast') && (seed % 4 === 1)) name += ' ' + pick(words.contrastExtra, 11);
    if ((theme === 'cool' || theme === 'blue' || theme === 'green') && (seed % 5 === 2)) name += ' ' + pick(words.cyberExtra, 23);

    return name;
  }

  const load = React.useCallback(async () => {
    // Cancel any in-flight fetch to avoid race conditions when switching sources/pages
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
  const reqId = ++requestIdRef.current;
  setError(null);
  setNotice(null);
  setProvider(null);
  setItems(null);
  setLoading(true);
    try {
  const params = new URLSearchParams();
  params.set('source', source);
  if (sort) params.set('sort', sort);
  if (keywords.trim()) params.set('keywords', keywords.trim());
  if (hueOption.trim()) params.set('hueOption', hueOption.trim());
  if (tag.trim()) params.set('tag', tag.trim());
  if (colorNumber) params.set('colorNumber', String(colorNumber));
  params.set('page', String(page));
  params.set('numResults', '36');
  if (source === 'colormind') {
    const effectiveModel = (cmModelCustom && cmModelCustom.trim()) ? cmModelCustom.trim() : cmModel;
    if (effectiveModel && effectiveModel !== 'default') params.set('model', effectiveModel);
    if (cmSeed.trim()) params.set('input', cmSeed.trim());
  }
      const res = await fetch(`/api/trending?${params.toString()}`, { cache: 'no-store', signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (reqId !== requestIdRef.current) return; // outdated response, ignore
  const respProvider = String(data?.provider || 'none');
      setProvider(respProvider);
      // Set a stable notice tied to this response only
      if ((source === 'colormind' && respProvider === 'colourlovers')) {
        setNotice('Colormind returned no palettes right now. Showing COLOURlovers instead.');
      } else if (source === 'colourlovers' && respProvider === 'colormind') {
        setNotice('COLOURlovers returned no palettes right now. Showing Colormind instead.');
      } else {
        setNotice(null);
      }
      let list: TrendingItem[] = (data?.palettes || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        author: p.author,
        colors: p.colors,
      }));
      // For Colormind, synthesize a fun, deterministic name from colors
      if (respProvider === 'colormind') {
        list = list.map((p) => ({ ...p, title: generateCrazyName(p.colors) }));
      }
      const tagged = list.map((it) => ({ ...it, tags: categorize(it.colors) }));
      setItems(tagged);
    } catch (e: any) {
      if (e?.name === 'AbortError') return; // ignore aborted requests
      setError('Using fallback palettes');
      setProvider('presets');
      setItems(
        PRESET_PALETTES.map((colors, i) => ({ id: `preset-${i}`, title: 'Preset', colors }))
          .map((it) => ({ ...it, tags: categorize(it.colors) }))
      );
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }, [source, sort, keywords, hueOption, tag, colorNumber, page]);

  // Persist simple preferences across reloads
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('tprefs');
      if (saved) {
        const s = JSON.parse(saved);
        if (s.source) setSource(s.source);
        if (s.sort) setSort(s.sort);
        if (typeof s.page === 'number') setPage(s.page);
        if (typeof s.cmModel === 'string') setCmModel(s.cmModel);
        if (typeof s.cmSeed === 'string') setCmSeed(s.cmSeed);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    try {
      const s = { source, sort, page, cmModel, cmSeed };
      localStorage.setItem('tprefs', JSON.stringify(s));
    } catch {}
  }, [source, sort, page, cmModel, cmSeed]);

  React.useEffect(() => { load(); }, [load]);

  // Load Colormind models list once
  React.useEffect(() => {
    let cancelled = false;
    const go = async () => {
      try {
        const res = await fetch('/api/colormind/models', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data?.models)) setCmModels(data.models);
      } catch {}
    };
    go();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Trending Palettes</h3>
          {provider && (
            <span className="text-xs px-2 py-0.5 rounded-full border border-gray-200 bg-white text-gray-700">
      Source: {provider === 'colourlovers' ? 'COLOURlovers' : provider === 'lospec' ? 'Lospec' : provider === 'colormind' ? 'Colormind' : 'Presets'}
      {provider === 'colormind' && (
        <>
          {' '}
          <span className="text-gray-400">•</span>
          {' '}
          <span className="text-gray-700">Model: {(cmModelCustom && cmModelCustom.trim()) ? cmModelCustom.trim() : cmModel || 'default'}</span>
        </>
      )}
            </span>
          )}
        </div>
      </div>
        {/* Compact filter bar */}
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
          <select value={source} onChange={(e) => { setPage(1); setSource(e.target.value as any); }} className="rounded-md border bg-transparent px-2 py-1">
            <option value="colormind">Colormind</option>
            <option value="colourlovers">COLOURlovers</option>
            <option value="auto">Auto</option>
          </select>
          <select value={sort} onChange={(e) => { setPage(1); setSort(e.target.value); }} className="rounded-md border bg-transparent px-2 py-1">
            {source === 'colourlovers' || source === 'auto' ? (
              <>
                <option value="top">Top</option>
                <option value="new">Newest</option>
              </>
            ) : source === 'lospec' ? (
              <>
                <option value="popular">Popular</option>
                <option value="downloads">Downloads</option>
                <option value="newest">Newest</option>
                <option value="az">A–Z</option>
              </>
            ) : (
              <>
                <option value="random">Random</option>
              </>
            )}
          </select>
          {source === 'colormind' && (
            <>
              {/* Model with datalist suggestions */}
              <input
                value={(cmModelCustom && cmModelCustom.trim()) || cmModel}
                onChange={(e) => { setPage(1); const v = e.target.value; if (v === 'default' || v === 'ui') { setCmModel(v); setCmModelCustom(''); } else { setCmModelCustom(v); } }}
                list="cm-models"
                placeholder="Model (default, ui, or daily)"
                className="rounded-md border bg-transparent px-2 py-1 w-48"
                title="Colormind model name"
              />
              <datalist id="cm-models">
                <option value="default" />
                <option value="ui" />
                {(cmModels || []).slice(0, 20).map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              {/* Seed input */}
              <input
                value={cmSeed}
                onChange={(e) => { setPage(1); setCmSeed(e.target.value); }}
                placeholder="#ff0000,N,N,N,N (or leave empty)"
                className="rounded-md border bg-transparent px-2 py-1 w-64"
                title="Seed up to 5 slots with hex or N, comma-separated"
              />
            </>
          )}
          <input
            value={keywords}
            onChange={(e) => { setPage(1); setKeywords(e.target.value); }}
            placeholder={source === 'lospec' ? 'Search (Lospec uses tag/size)' : (source === 'colormind' ? 'Not used for Colormind' : 'Keywords (COLOURlovers)')}
            className="rounded-md border bg-transparent px-2 py-1"
          />
          {source === 'colourlovers' && (
            <input
              value={hueOption}
              onChange={(e) => { setPage(1); setHueOption(e.target.value); }}
              placeholder="Hue option: red,blue,green"
              className="rounded-md border bg-transparent px-2 py-1"
            />
          )}
          {source === 'lospec' && (
            <>
              <input
                value={tag}
                onChange={(e) => { setPage(1); setTag(e.target.value); }}
                placeholder="Tag (e.g. pastel)"
                className="rounded-md border bg-transparent px-2 py-1"
              />
              <select
                value={String(colorNumber ?? '')}
                onChange={(e) => { setPage(1); setColorNumber(e.target.value ? Number(e.target.value) : undefined); }}
                className="rounded-md border bg-transparent px-2 py-1"
              >
                <option value="">Any size</option>
                <option value="3">3 colors</option>
                <option value="4">4 colors</option>
                <option value="5">5 colors</option>
                <option value="6">6 colors</option>
                <option value="7">7 colors</option>
                <option value="8">8 colors</option>
              </select>
            </>
          )}
          <button onClick={() => setPage((p: number) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-md border px-2 py-1 disabled:opacity-50">Prev</button>
          <span>Page {page}</span>
          <button onClick={() => setPage((p: number) => p + 1)} className="rounded-md border px-2 py-1">Next</button>
        </div>
        {notice && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">{notice}</div>
        )}
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
                {item.title || 'Palette'} {item.author && provider !== 'colormind' ? `• ${item.author}` : ''}
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
