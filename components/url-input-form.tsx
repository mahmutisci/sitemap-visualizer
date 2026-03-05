"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, X } from "lucide-react";

interface UrlInputFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  onClear: () => void;
  hasResults: boolean;
  initialUrl?: string;
}

export function UrlInputForm({
  onSubmit,
  isLoading,
  onClear,
  hasResults,
  initialUrl,
}: UrlInputFormProps) {
  const [url, setUrl] = useState(initialUrl || "");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Please enter a sitemap URL");
      return;
    }

    try {
      new URL(url.trim());
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    onSubmit(url.trim());
  };

  const handleClear = () => {
    setUrl("");
    setError("");
    onClear();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="url"
            placeholder="https://example.com/sitemap.xml"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            className="pl-9 h-10 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
          />
          {url && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setUrl("");
                setError("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear input"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Crawling...
            </>
          ) : (
            "Analyze"
          )}
        </Button>
        {hasResults && !isLoading && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            className="h-10 border-border text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}
