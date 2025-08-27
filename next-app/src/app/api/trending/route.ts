import { NextResponse, NextRequest } from 'next/server';
export const runtime = 'nodejs';

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

type CLParams = {
  sort?: 'top' | 'new' | 'random';
  hueOption?: string; // CSV of color words
  keywords?: string;
  numResults?: number;
  resultOffset?: number;
};

async function tryColourLovers(params: CLParams = {}): Promise<{ provider: 'colourlovers'; palettes: any[] } | null> {
  const url = 'https://www.colourlovers.com/api/palettes/top?format=json&numResults=40';
  let res: Response | null = null;
  try {
    const endpoint = (() => {
      if (params.sort === 'new') return 'new';
      // colourlovers random endpoint exists but returns one palette w/ no params; treat as top
      return 'top';
    })();

    const qs = new URLSearchParams();
    qs.set('format', 'json');
    if (params.numResults) qs.set('numResults', String(params.numResults));
    if (params.resultOffset) qs.set('resultOffset', String(params.resultOffset));
    if (params.hueOption) qs.set('hueOption', params.hueOption);
    if (params.keywords) {
      qs.set('keywords', params.keywords);
      qs.set('keywordExact', '0');
    }
    const fullUrl = `https://www.colourlovers.com/api/palettes/${endpoint}?${qs.toString()}`;

    res = await withTimeout(fullUrl, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'PBIX Theme Creator (Next.js)',
        'Accept': 'application/json',
      },
      timeoutMs: 6000,
    });
    if (!res.ok) {
      res = await withTimeout(fullUrl, {
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

type LospecParams = {
  sort?: 'popular' | 'downloads' | 'newest' | 'az';
  colorNumber?: number;
  tag?: string;
  perPage?: number;
  page?: number;
};

async function tryLospec(params: LospecParams = {}): Promise<{ provider: 'lospec'; palettes: any[] } | null> {
  // Lospec palette list JSON. Filter to 5+ colors to match our editor well.
  const qs = new URLSearchParams();
  qs.set('perPage', String(params.perPage ?? 50));
  qs.set('page', String(params.page ?? 1));
  qs.set('sort', params.sort ?? 'popular');
  if (params.colorNumber) qs.set('colorNumber', String(params.colorNumber));
  if (params.tag) qs.set('tag', params.tag);
  const url = `https://lospec.com/palette-list.json?${qs.toString()}`;
  let res: Response | null = null;
  try {
    // First attempt with our UA
    res = await withTimeout(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://lospec.com/palette-list',
      },
      timeoutMs: 7000,
    });
    if (!res.ok) {
      // Second attempt with alternate UA string
      res = await withTimeout(url, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://lospec.com/palette-list',
        },
        timeoutMs: 7000,
      });
      if (!res.ok) return null;
    }
    const data = (await res.json()) as LospecPalette[] | null;
    let mapped = (data || [])
      .filter((p) => Array.isArray(p.colors) && p.colors.length >= 3)
      .slice(0, 36)
      .map((p, idx) => ({
        id: `lospec-${idx}-${encodeURIComponent(p.name)}`.slice(0, 60),
        title: p.name || 'Untitled',
        author: p.author || 'Lospec',
        colors: p.colors.map((h) => `#${h.replace(/^#/, '')}`),
      }));
    // If empty, try a final pass without tag/size restrictions (sometimes those yield 0)
    if (mapped.length === 0 && (params.tag || params.colorNumber)) {
      const qs2 = new URLSearchParams();
      qs2.set('perPage', String(params.perPage ?? 50));
      qs2.set('page', String(params.page ?? 1));
      qs2.set('sort', params.sort ?? 'popular');
      const url2 = `https://lospec.com/palette-list.json?${qs2.toString()}`;
      const res2 = await withTimeout(url2, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://lospec.com/palette-list',
        },
        timeoutMs: 7000,
      });
      if (res2.ok) {
        const data2 = (await res2.json()) as LospecPalette[] | null;
        mapped = (data2 || [])
          .filter((p) => Array.isArray(p.colors) && p.colors.length >= 3)
          .slice(0, 36)
          .map((p, idx) => ({
            id: `lospec-${idx}-${encodeURIComponent(p.name)}`.slice(0, 60),
            title: p.name || 'Untitled',
            author: p.author || 'Lospec',
            colors: p.colors.map((h) => `#${h.replace(/^#/, '')}`),
          }));
      }
    }
    if (mapped.length > 0) return { provider: 'lospec', palettes: mapped };
    return null;
  } catch {
    return null;
  }
}

type ColormindParams = {
  numResults?: number;
  model?: string; // e.g., 'default', 'ui', etc.
  input?: (number[] | 'N')[]; // exactly 5 entries if provided
};

async function tryColormind(params: ColormindParams = {}): Promise<{ provider: 'colormind'; palettes: any[] } | null> {
  const count = Math.min(24, Math.max(1, params.numResults || 12));
  const model = params.model || 'default';
  const concurrency = 6; // be polite to the public API
  const postOnce = async (url: string) => {
    try {
      const res = await withTimeout(url, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PBIX Theme Creator (Next.js)'
        },
        body: JSON.stringify(params.input && params.input.length > 0 ? { model, input: params.input } : { model }),
        timeoutMs: 7000,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { result?: number[][] } | null;
      const arr = data?.result || [];
      if (!Array.isArray(arr) || arr.length === 0) return null;
      const colors = arr
        .map((rgb) => {
          if (!Array.isArray(rgb) || rgb.length < 3) return null;
          const [r, g, b] = rgb;
          const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
          return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        })
        .filter(Boolean) as string[];
      if (colors.length < 3) return null;
      const fingerprint = colors.map(c => c.slice(1,3)).join('').slice(0,8).toUpperCase();
  const id = `colormind-${fingerprint}-${Math.random().toString(36).slice(2,6)}`;
  return { id, title: 'Generated Palette', author: 'Colormind', colors };
    } catch {
      return null;
    }
  };
  const fetchOne = async () => {
    // Try HTTP first (works in some environments), then HTTPS fallback
    return (await postOnce('http://colormind.io/api/')) || (await postOnce('https://colormind.io/api/'));
  };

  // Run with limited concurrency for speed + courtesy
  const out: any[] = [];
  const runBatch = async (batchSize: number) => {
    const tasks = Array.from({ length: batchSize }, () => fetchOne());
    const results = await Promise.all(tasks);
    for (const r of results) if (r) out.push(r);
  };
  let remaining = count;
  while (remaining > 0) {
    const n = Math.min(concurrency, remaining);
    await runBatch(n);
    remaining -= n;
  }
  if (out.length > 0) return { provider: 'colormind', palettes: out };
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = (searchParams.get('source') || 'auto') as 'auto' | 'colourlovers' | 'lospec' | 'colormind';
  const sort = searchParams.get('sort') || undefined;
  const keywords = searchParams.get('keywords') || undefined;
  const hueOption = searchParams.get('hueOption') || undefined;
  const tag = searchParams.get('tag') || undefined;
  const colorNumberStr = searchParams.get('colorNumber');
  const colorNumber = colorNumberStr ? Number(colorNumberStr) : undefined;
  const numResultsStr = searchParams.get('numResults') || '36';
  const numResults = Math.min(50, Math.max(1, Number(numResultsStr) || 36));
  const pageStr = searchParams.get('page') || '1';
  const page = Math.max(1, Number(pageStr) || 1);
  const resultOffset = (page - 1) * numResults;
  const model = searchParams.get('model') || undefined;
  const inputStr = searchParams.get('input') || undefined;

  // Parse Colormind input if provided. Accept 1-5 comma-separated items of hex colors or 'N'.
  const parseColormindInput = (inp: string | undefined): (number[] | 'N')[] | undefined => {
    if (!inp) return undefined;
    const parts = inp.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (parts.length === 0) return undefined;
    const toRgb = (hex: string): number[] | null => {
      const h = hex.replace(/^#/,'');
      if (![3,6].includes(h.length)) return null;
      const h6 = h.length === 3 ? h.split('').map(ch => ch+ch).join('') : h;
      const r = parseInt(h6.slice(0,2), 16);
      const g = parseInt(h6.slice(2,4), 16);
      const b = parseInt(h6.slice(4,6), 16);
      if ([r,g,b].some(n => Number.isNaN(n))) return null;
      return [r,g,b];
    };
    const arr: (number[] | 'N')[] = parts.slice(0,5).map(p => (p.toUpperCase() === 'N' ? 'N' : (toRgb(p) || 'N')));
    while (arr.length < 5) arr.push('N');
    return arr;
  };
  const inputParsed = parseColormindInput(inputStr);

  // Build per-provider params
  const clParams: CLParams = {
    sort: (sort === 'new' ? 'new' : 'top'),
    hueOption,
    keywords,
    numResults,
    resultOffset,
  };
  const lospecParams: LospecParams = {
    sort: (['popular', 'downloads', 'newest', 'az'].includes(String(sort)) ? (sort as any) : 'popular'),
    colorNumber,
    tag,
    perPage: numResults,
    page,
  };
  const cmParams: ColormindParams = { numResults, model, input: inputParsed };

  if (source === 'colourlovers') {
  const res = await tryColourLovers(clParams);
  if (res) return NextResponse.json({ provider: res.provider, palettes: res.palettes });
  // Fallback to Lospec if CL is empty/unavailable
  const fallback = await tryColormind(cmParams);
  if (fallback) return NextResponse.json({ provider: fallback.provider, palettes: fallback.palettes });
  return NextResponse.json({ provider: 'none', palettes: [] });
  }
  if (source === 'lospec') {
  const res = await tryLospec(lospecParams);
  if (res) return NextResponse.json({ provider: res.provider, palettes: res.palettes });
  // Fallback to COLOURlovers if Lospec is empty/unavailable
  const fallback = await tryColourLovers(clParams) || await tryColormind(cmParams);
  if (fallback) return NextResponse.json({ provider: fallback.provider, palettes: fallback.palettes });
  return NextResponse.json({ provider: 'none', palettes: [] });
  }
  if (source === 'colormind') {
    const res = await tryColormind(cmParams);
    if (res) return NextResponse.json({ provider: res.provider, palettes: res.palettes });
    const fallback = await tryColourLovers(clParams) || await tryLospec(lospecParams);
    if (fallback) return NextResponse.json({ provider: fallback.provider, palettes: fallback.palettes });
    return NextResponse.json({ provider: 'none', palettes: [] });
  }

  // Auto: try CL then Lospec
  const primary = await tryColormind(cmParams);
  if (primary) return NextResponse.json({ provider: primary.provider, palettes: primary.palettes });
  const secondary = await tryColourLovers(clParams);
  if (secondary) return NextResponse.json({ provider: secondary.provider, palettes: secondary.palettes });
  return NextResponse.json({ provider: 'none', palettes: [] }, { status: 200 });
}
