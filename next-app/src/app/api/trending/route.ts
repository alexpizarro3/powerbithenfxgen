import { NextResponse } from 'next/server';

type ColourLoversPalette = {
  id: number;
  title: string;
  userName?: string;
  colors: string[]; // hex without '#'
  numViews?: number;
  numVotes?: number;
  numComments?: number;
  rank?: number;
};

type LospecPalette = {
  name: string;
  author?: string;
  colors: string[]; // hex without '#'
  // Extra props may exist; we only use above
};

export const revalidate = 3600; // cache for 1 hour on the server

const withTimeout = async (url: string, opts: RequestInit & { timeoutMs?: number } = {}) => {
  const { timeoutMs = 7000, ...rest } = opts;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
};

async function tryColourLovers(): Promise<{ provider: 'colourlovers'; palettes: any[] } | null> {
  const url = 'https://www.colourlovers.com/api/palettes/top?format=json&numResults=40';
  let res: Response | null = null;
  try {
    res = await withTimeout(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'PBIX Theme Creator (Next.js)',
        'Accept': 'application/json',
      },
      timeoutMs: 6000,
    });
    if (!res.ok) {
      res = await withTimeout(url, {
        cache: 'no-store',
        headers: { 'User-Agent': 'PBIX Theme Creator (retry)', 'Accept': 'application/json' },
        timeoutMs: 6000,
      });
      if (!res.ok) return null;
    }
    const data = (await res.json()) as ColourLoversPalette[] | null;
    const mapped = (data || [])
      .filter((p) => Array.isArray(p.colors) && p.colors.length >= 3)
      .slice(0, 36)
      .map((p) => ({
        id: String(p.id),
        title: p.title || 'Untitled',
        author: p.userName || 'Unknown',
        colors: p.colors.map((h) => `#${h.replace(/^#/, '')}`),
        stats: {
          views: p.numViews ?? 0,
          votes: p.numVotes ?? 0,
          comments: p.numComments ?? 0,
          rank: p.rank ?? 0,
        },
      }));
    if (mapped.length > 0) return { provider: 'colourlovers', palettes: mapped };
    return null;
  } catch {
    return null;
  }
}

async function tryLospec(): Promise<{ provider: 'lospec'; palettes: any[] } | null> {
  // Lospec palette list JSON. Filter to 5+ colors to match our editor well.
  const url = 'https://lospec.com/palette-list.json?perPage=50&sort=popular&colorNumber=5';
  let res: Response | null = null;
  try {
    res = await withTimeout(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'PBIX Theme Creator (Next.js)',
        'Accept': 'application/json',
      },
      timeoutMs: 6000,
    });
    if (!res.ok) {
      res = await withTimeout(url, {
        cache: 'no-store',
        headers: { 'User-Agent': 'PBIX Theme Creator (retry)', 'Accept': 'application/json' },
        timeoutMs: 6000,
      });
      if (!res.ok) return null;
    }
    const data = (await res.json()) as LospecPalette[] | null;
    const mapped = (data || [])
      .filter((p) => Array.isArray(p.colors) && p.colors.length >= 3)
      .slice(0, 36)
      .map((p, idx) => ({
        id: `lospec-${idx}-${encodeURIComponent(p.name)}`.slice(0, 60),
        title: p.name || 'Untitled',
        author: p.author || 'Lospec',
        colors: p.colors.map((h) => `#${h.replace(/^#/, '')}`),
      }));
    if (mapped.length > 0) return { provider: 'lospec', palettes: mapped };
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  // Try ColourLovers first, then Lospec
  const primary = await tryColourLovers();
  if (primary) return NextResponse.json({ provider: primary.provider, palettes: primary.palettes });

  const secondary = await tryLospec();
  if (secondary) return NextResponse.json({ provider: secondary.provider, palettes: secondary.palettes });

  // Both failed: return empty list with hint; client will show fallback presets.
  return NextResponse.json({ provider: 'none', palettes: [] }, { status: 200 });
}
