"use client";

import { Loader2, Radio } from "lucide-react";

export function CrawlLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-2 border-primary/20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary/80 animate-pulse" />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-lg font-semibold text-foreground">
          Crawling Sitemap
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Fetching and parsing your sitemap XML files. This may take a moment
          for sitemaps with many nested indexes...
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Radio className="h-3 w-3 text-primary animate-pulse" />
        <span>Resolving nested sitemaps</span>
      </div>
    </div>
  );
}
