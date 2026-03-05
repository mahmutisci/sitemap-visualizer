"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { UrlInputForm } from "@/components/url-input-form";
import { SitemapTree } from "@/components/sitemap-tree";
import { SitemapStatsView } from "@/components/sitemap-stats";
import { CrawlLoading } from "@/components/crawl-loading";
import { EmptyState } from "@/components/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Network, BarChart3, TreePine, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildTree,
  calculateStats,
  type CrawlResponse,
  type TreeNode,
  type SitemapStats,
  type SitemapUrl,
} from "@/lib/sitemap-types";

function generateCsv(urls: SitemapUrl[]): string {
  const header = "#,URL,Last Modified";
  const escapeField = (field: string) => {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };
  const rows = urls.map((u, index) =>
    [
      index + 1,
      escapeField(u.loc),
      u.lastmod ?? "",
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

function downloadCsv(urls: SitemapUrl[], sourceUrl: string) {
  const csv = generateCsv(urls);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  try {
    const hostname = new URL(sourceUrl).hostname.replace(/\./g, "_");
    link.download = `sitemap_${hostname}_${new Date().toISOString().slice(0, 10)}.csv`;
  } catch {
    link.download = `sitemap_export_${new Date().toISOString().slice(0, 10)}.csv`;
  }
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function SitemapVisualizerPageWrapper() {
  return (
    <Suspense fallback={<CrawlLoading />}>
      <SitemapVisualizerPage />
    </Suspense>
  );
}

function SitemapVisualizerPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [crawlData, setCrawlData] = useState<CrawlResponse | null>(null);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [stats, setStats] = useState<SitemapStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [crawledUrl, setCrawledUrl] = useState<string | null>(null);
  const autoTriggered = useRef(false);

  const handleSubmit = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    setCrawlData(null);
    setTree(null);
    setStats(null);
    setCrawledUrl(url);

    try {
      const response = await fetch("/api/crawl-sitemap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to crawl sitemap");
        return;
      }

      if (data.totalUrls === 0 && data.errors?.length > 0) {
        setError(
          `Could not parse any URLs. Errors: ${data.errors.join(", ")}`
        );
        return;
      }

      setCrawlData(data);
      setTree(buildTree(data.urls));
      setStats(calculateStats(data.urls, data.sitemapCount));
    } catch (err) {
      setError(
        `Network error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    setCrawlData(null);
    setTree(null);
    setStats(null);
    setError(null);
    setCrawledUrl(null);
  }, []);

  // Auto-crawl when ?url= query parameter is present
  const queryUrl = searchParams.get("url");
  useEffect(() => {
    if (queryUrl && !autoTriggered.current) {
      autoTriggered.current = true;
      handleSubmit(queryUrl);
    }
  }, [queryUrl, handleSubmit]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Network className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">
                  Sitemap Visualizer v2
                </h1>
                <p className="text-xs text-muted-foreground">
                  Crawl, visualize, and analyze XML sitemaps
                </p>
              </div>
              {crawlData && (
                <div className="ml-auto flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-mono">
                    {crawlData.totalUrls.toLocaleString()} URLs
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {crawlData.sitemapCount} sitemap
                    {crawlData.sitemapCount !== 1 ? "s" : ""}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => downloadCsv(crawlData.urls, crawledUrl ?? "")}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export CSV
                  </Button>
                </div>
              )}
            </div>
            <UrlInputForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              onClear={handleClear}
              hasResults={!!crawlData}
              initialUrl={queryUrl ?? ""}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Loading State */}
        {isLoading && <CrawlLoading />}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="bg-destructive/5 border-destructive/20 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-foreground">
                  Failed to Crawl Sitemap
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                {crawledUrl && (
                  <p className="text-xs text-muted-foreground mt-2 font-mono break-all">
                    {crawledUrl}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Results */}
        {crawlData && tree && stats && !isLoading && (
          <Tabs defaultValue="tree" className="flex flex-col gap-4">
            <TabsList className="bg-secondary border border-border w-fit">
              <TabsTrigger
                value="tree"
                className="gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground"
              >
                <TreePine className="h-3.5 w-3.5" />
                Sitemap Tree
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Statistics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tree" className="mt-0">
              <Card className="bg-card border-border overflow-hidden">
                <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TreePine className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-medium text-foreground">
                      Site Structure
                    </h2>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {crawlData.totalUrls.toLocaleString()} URLs across{" "}
                    {stats.uniqueDomains.length} domain
                    {stats.uniqueDomains.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="h-[600px]">
                  <SitemapTree tree={tree} />
                </div>
              </Card>

              {/* Crawl Warnings */}
              {crawlData.errors.length > 0 && (
                <Card className="bg-card border-border mt-4 p-4">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                    <AlertCircle className="h-3.5 w-3.5 text-chart-4" />
                    Crawl Warnings ({crawlData.errors.length})
                  </h3>
                  <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                    {crawlData.errors.map((err, i) => (
                      <p
                        key={i}
                        className="text-xs text-muted-foreground font-mono break-all"
                      >
                        {err}
                      </p>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="stats" className="mt-0">
              <SitemapStatsView stats={stats} />
            </TabsContent>
          </Tabs>
        )}

        {/* Empty state */}
        {!isLoading && !crawlData && !error && <EmptyState />}
      </main>
    </div>
  );
}
