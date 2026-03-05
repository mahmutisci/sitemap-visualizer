import { NextRequest, NextResponse } from "next/server";

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

interface CrawlResult {
  urls: SitemapUrl[];
  sitemapCount: number;
  errors: string[];
}

const MAX_SITEMAPS = 50;
const FETCH_TIMEOUT = 15000;

async function fetchWithTimeout(url: string, timeout: number): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "SitemapVisualizer/1.0",
        Accept: "application/xml, text/xml, */*",
      },
    });
    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

function extractTag(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "gi");
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1].trim());
  }
  return matches;
}

function extractUrlEntries(xml: string): SitemapUrl[] {
  const urls: SitemapUrl[] = [];
  const urlBlockRegex = /<url>([\s\S]*?)<\/url>/gi;
  let block;

  while ((block = urlBlockRegex.exec(xml)) !== null) {
    const content = block[1];
    const loc = extractTag(content, "loc")[0];
    if (!loc) continue;

    const lastmod = extractTag(content, "lastmod")[0];
    const changefreq = extractTag(content, "changefreq")[0];
    const priority = extractTag(content, "priority")[0];

    urls.push({
      loc,
      ...(lastmod && { lastmod }),
      ...(changefreq && { changefreq }),
      ...(priority && { priority }),
    });
  }

  return urls;
}

function isSitemapIndex(xml: string): boolean {
  return /<sitemapindex/i.test(xml);
}

function extractSitemapLocs(xml: string): string[] {
  const locs: string[] = [];
  const sitemapBlockRegex = /<sitemap>([\s\S]*?)<\/sitemap>/gi;
  let block;

  while ((block = sitemapBlockRegex.exec(xml)) !== null) {
    const loc = extractTag(block[1], "loc")[0];
    if (loc) locs.push(loc);
  }

  return locs;
}

async function crawlSitemap(
  url: string,
  result: CrawlResult,
  visited: Set<string>,
  depth: number = 0
): Promise<void> {
  if (visited.has(url) || visited.size >= MAX_SITEMAPS) return;
  visited.add(url);

  try {
    const xml = await fetchWithTimeout(url, FETCH_TIMEOUT);
    result.sitemapCount++;

    if (isSitemapIndex(xml)) {
      const childSitemaps = extractSitemapLocs(xml);
      const fetchPromises = childSitemaps
        .filter((loc) => !visited.has(loc))
        .slice(0, MAX_SITEMAPS - visited.size)
        .map((loc) => crawlSitemap(loc, result, visited, depth + 1));

      await Promise.allSettled(fetchPromises);
    } else {
      const urls = extractUrlEntries(xml);
      result.urls.push(...urls);
    }
  } catch (error) {
    result.errors.push(
      `Failed to fetch ${url}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid sitemap URL is required" },
        { status: 400 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const result: CrawlResult = {
      urls: [],
      sitemapCount: 0,
      errors: [],
    };

    const visited = new Set<string>();
    await crawlSitemap(url, result, visited);

    return NextResponse.json({
      urls: result.urls,
      sitemapCount: result.sitemapCount,
      totalUrls: result.urls.length,
      errors: result.errors,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Server error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
