"use client";

import { MapIcon } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
      <div className="h-20 w-20 rounded-2xl bg-secondary/80 flex items-center justify-center border border-border">
        <MapIcon className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-2 max-w-md">
        <h3 className="text-lg font-semibold text-foreground">
          Visualize Any Sitemap
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Paste an XML sitemap URL above to crawl, visualize the site tree
          structure, and analyze statistics. Supports sitemap index files with
          nested sitemaps.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {[
          "Recursive crawling",
          "Tree visualization",
          "Statistics overview",
          "Meta tag analysis",
        ].map((feature) => (
          <span
            key={feature}
            className="text-xs text-muted-foreground px-3 py-1 rounded-full border border-border bg-secondary/50"
          >
            {feature}
          </span>
        ))}
      </div>
    </div>
  );
}
