export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export interface CrawlResponse {
  urls: SitemapUrl[];
  sitemapCount: number;
  totalUrls: number;
  errors: string[];
}

export interface TreeNode {
  name: string;
  fullPath: string;
  children: TreeNode[];
  urlCount: number;
  meta?: SitemapUrl;
  isLeaf: boolean;
}

export interface SitemapStats {
  totalUrls: number;
  sitemapCount: number;
  uniqueDomains: string[];
  changefreqDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  topDirectories: { path: string; count: number }[];
  urlsWithLastmod: number;
  urlsWithChangefreq: number;
  urlsWithPriority: number;
  oldestUrl?: string;
  newestUrl?: string;
  depthDistribution: Record<number, number>;
}

export function buildTree(urls: SitemapUrl[]): TreeNode {
  const root: TreeNode = {
    name: "Root",
    fullPath: "/",
    children: [],
    urlCount: urls.length,
    isLeaf: false,
  };

  for (const url of urls) {
    try {
      const parsed = new URL(url.loc);
      const domain = parsed.hostname;
      const pathParts = parsed.pathname
        .split("/")
        .filter((p) => p.length > 0);

      let domainNode = root.children.find((c) => c.name === domain);
      if (!domainNode) {
        domainNode = {
          name: domain,
          fullPath: domain,
          children: [],
          urlCount: 0,
          isLeaf: false,
        };
        root.children.push(domainNode);
      }
      domainNode.urlCount++;

      let current = domainNode;
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        const fullPath = `${current.fullPath}/${part}`;
        let child = current.children.find((c) => c.name === part);
        if (!child) {
          child = {
            name: part,
            fullPath,
            children: [],
            urlCount: 0,
            isLeaf: i === pathParts.length - 1,
          };
          current.children.push(child);
        }
        child.urlCount++;
        if (i === pathParts.length - 1) {
          child.meta = url;
          child.isLeaf = true;
        }
        current = child;
      }

      // handle root path "/"
      if (pathParts.length === 0) {
        domainNode.meta = url;
      }
    } catch {
      // skip malformed URLs
    }
  }

  // sort children by urlCount descending
  function sortTree(node: TreeNode) {
    node.children.sort((a, b) => b.urlCount - a.urlCount);
    node.children.forEach(sortTree);
  }
  sortTree(root);

  return root;
}

export function calculateStats(
  urls: SitemapUrl[],
  sitemapCount: number
): SitemapStats {
  const domains = new Set<string>();
  const changefreqDist: Record<string, number> = {};
  const priorityDist: Record<string, number> = {};
  const dirCount: Record<string, number> = {};
  const depthDist: Record<number, number> = {};
  let urlsWithLastmod = 0;
  let urlsWithChangefreq = 0;
  let urlsWithPriority = 0;
  let oldest: string | undefined;
  let newest: string | undefined;

  for (const url of urls) {
    try {
      const parsed = new URL(url.loc);
      domains.add(parsed.hostname);

      const parts = parsed.pathname.split("/").filter((p) => p.length > 0);
      const depth = parts.length;
      depthDist[depth] = (depthDist[depth] || 0) + 1;

      if (parts.length > 0) {
        const topDir = `/${parts[0]}`;
        dirCount[topDir] = (dirCount[topDir] || 0) + 1;
      } else {
        dirCount["/"] = (dirCount["/"] || 0) + 1;
      }
    } catch {
      // skip
    }

    if (url.changefreq) {
      urlsWithChangefreq++;
      changefreqDist[url.changefreq] =
        (changefreqDist[url.changefreq] || 0) + 1;
    }

    if (url.priority) {
      urlsWithPriority++;
      priorityDist[url.priority] = (priorityDist[url.priority] || 0) + 1;
    }

    if (url.lastmod) {
      urlsWithLastmod++;
      if (!oldest || url.lastmod < oldest) oldest = url.lastmod;
      if (!newest || url.lastmod > newest) newest = url.lastmod;
    }
  }

  const topDirectories = Object.entries(dirCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  return {
    totalUrls: urls.length,
    sitemapCount,
    uniqueDomains: Array.from(domains),
    changefreqDistribution: changefreqDist,
    priorityDistribution: priorityDist,
    topDirectories,
    urlsWithLastmod,
    urlsWithChangefreq,
    urlsWithPriority,
    oldestUrl: oldest,
    newestUrl: newest,
    depthDistribution: depthDist,
  };
}
