import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const revalidate = 3600;

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

export async function GET() {
  const postOnce = async (url: string) => {
    try {
      const res = await withTimeout(url, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = (await res.json()) as { result?: string[] } | null;
      const list = data?.result || [];
      if (!Array.isArray(list) || list.length === 0) return null;
      return list;
    } catch {
      return null;
    }
  };
  // Colormind lists models via GET http://colormind.io/list/
  const httpRes = await postOnce('http://colormind.io/list/');
  if (httpRes) return NextResponse.json({ models: httpRes });
  const httpsRes = await postOnce('https://colormind.io/list/');
  if (httpsRes) return NextResponse.json({ models: httpsRes });
  return NextResponse.json({ models: [] }, { status: 200 });
}
