"use client";

import { useState, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  Globe,
  Search,
  Copy,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TreeNode } from "@/lib/sitemap-types";

function TreeNodeItem({
  node,
  depth = 0,
  searchQuery,
}: {
  node: TreeNode;
  depth?: number;
  searchQuery: string;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [copied, setCopied] = useState(false);

  const hasChildren = node.children.length > 0;
  const matchesSearch =
    searchQuery.length > 0 &&
    node.name.toLowerCase().includes(searchQuery.toLowerCase());

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (node.meta?.loc) {
        navigator.clipboard.writeText(node.meta.loc);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    },
    [node.meta?.loc]
  );

  // Filter children based on search
  const filteredChildren = searchQuery
    ? node.children.filter(
      (child) =>
        child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.fullPath.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.children.length > 0
    )
    : node.children;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer transition-colors hover:bg-accent/50 group ${matchesSearch ? "bg-primary/10 ring-1 ring-primary/30" : ""
          }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
        role="treeitem"
        aria-expanded={hasChildren ? expanded : undefined}
      >
        {hasChildren ? (
          <span className="text-muted-foreground shrink-0">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        <span className="shrink-0">
          {depth === 0 ? (
            <Globe className="h-4 w-4 text-primary" />
          ) : depth === 1 ? (
            <Globe className="h-4 w-4 text-chart-2" />
          ) : hasChildren ? (
            <Folder className="h-4 w-4 text-chart-3" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}
        </span>

        <span
          className={`text-sm truncate ${depth === 0
              ? "font-semibold text-foreground"
              : depth === 1
                ? "font-medium text-foreground"
                : node.isLeaf
                  ? "text-muted-foreground"
                  : "text-foreground"
            }`}
        >
          {node.name}
        </span>

        <Badge
          variant="secondary"
          className="ml-auto text-[10px] px-1.5 py-0 h-4 shrink-0 font-mono"
        >
          {node.urlCount}
        </Badge>

        {node.meta?.loc && (
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Copy URL"
          >
            {copied ? (
              <Check className="h-3 w-3 text-primary" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        )}
      </div>

      {expanded && hasChildren && (
        <div role="group">
          {filteredChildren.map((child, i) => (
            <TreeNodeItem
              key={`${child.fullPath}-${i}`}
              node={child}
              depth={depth + 1}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SitemapTree({ tree }: { tree: TreeNode }) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter paths..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm bg-secondary/50 border-border"
          />
        </div>
      </div>
      <ScrollArea className="flex-1 overflow-auto">
        <div className="p-2" role="tree">
          <TreeNodeItem node={tree} depth={0} searchQuery={searchQuery} />
        </div>
      </ScrollArea>
    </div>
  );
}
