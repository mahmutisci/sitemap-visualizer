"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Link2,
  FileText,
  Globe,
  Clock,
  BarChart3,
  Layers,
  CalendarDays,
  FolderTree,
} from "lucide-react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { SitemapStats } from "@/lib/sitemap-types";

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold text-foreground tracking-tight mt-0.5">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SitemapStatsView({ stats }: { stats: SitemapStats }) {
  const dirChartData = stats.topDirectories.map((d) => ({
    name: d.path.length > 15 ? d.path.slice(0, 15) + "..." : d.path,
    fullName: d.path,
    count: d.count,
  }));

  const changefreqData = Object.entries(stats.changefreqDistribution).map(
    ([name, value]) => ({ name, value })
  );

  const priorityData = Object.entries(stats.priorityDistribution)
    .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
    .map(([name, value]) => ({ name, value }));

  const depthData = Object.entries(stats.depthDistribution)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([depth, count]) => ({
      name: `Depth ${depth}`,
      count,
    }));

  const metaCoverage = [
    {
      label: "Last Modified",
      count: stats.urlsWithLastmod,
      pct: stats.totalUrls
        ? Math.round((stats.urlsWithLastmod / stats.totalUrls) * 100)
        : 0,
    },
    {
      label: "Change Freq",
      count: stats.urlsWithChangefreq,
      pct: stats.totalUrls
        ? Math.round((stats.urlsWithChangefreq / stats.totalUrls) * 100)
        : 0,
    },
    {
      label: "Priority",
      count: stats.urlsWithPriority,
      pct: stats.totalUrls
        ? Math.round((stats.urlsWithPriority / stats.totalUrls) * 100)
        : 0,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Link2}
          label="Total URLs"
          value={stats.totalUrls}
          sub={`Across ${stats.sitemapCount} sitemap${stats.sitemapCount !== 1 ? "s" : ""}`}
        />
        <StatCard
          icon={FileText}
          label="Sitemaps Crawled"
          value={stats.sitemapCount}
        />
        <StatCard
          icon={Globe}
          label="Unique Domains"
          value={stats.uniqueDomains.length}
          sub={stats.uniqueDomains[0]}
        />
        <StatCard
          icon={Layers}
          label="Max Depth"
          value={
            Object.keys(stats.depthDistribution).length > 0
              ? Math.max(
                  ...Object.keys(stats.depthDistribution).map(Number)
                )
              : 0
          }
          sub="Path segments deep"
        />
      </div>

      {/* Dates */}
      {(stats.oldestUrl || stats.newestUrl) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stats.oldestUrl && (
            <Card className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-4/10">
                  <CalendarDays className="h-4 w-4 text-chart-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Oldest Modified
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {stats.oldestUrl}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {stats.newestUrl && (
            <Card className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Newest Modified
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {stats.newestUrl}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Meta Coverage */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Meta Tag Coverage
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {metaCoverage.map((item) => (
            <div key={item.label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-xs font-mono text-foreground">
                  {item.count.toLocaleString()}{" "}
                  <span className="text-muted-foreground">({item.pct}%)</span>
                </span>
              </div>
              <Progress value={item.pct} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Top Directories Chart */}
      {dirChartData.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-primary" />
              Top Directories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dirChartData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      color: "var(--color-foreground)",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, _name: string, props: { payload: { fullName: string } }) => [
                      `${value.toLocaleString()} URLs`,
                      props.payload.fullName,
                    ]}
                  />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Depth Distribution */}
      {depthData.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              URL Depth Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={depthData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      color: "var(--color-foreground)",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} URLs`]}
                  />
                  <Bar dataKey="count" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Changefreq Distribution */}
        {changefreqData.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground">
                Change Frequency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={changefreqData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {changefreqData.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                        color: "var(--color-foreground)",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {changefreqData.map((item, i) => (
                  <Badge
                    key={item.name}
                    variant="secondary"
                    className="text-xs gap-1.5"
                  >
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{
                        backgroundColor:
                          CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                    {item.name}: {item.value}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Priority Distribution */}
        {priorityData.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground">
                Priority Values
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {priorityData.map((item) => {
                  const pct = stats.totalUrls
                    ? Math.round((item.value / stats.totalUrls) * 100)
                    : 0;
                  return (
                    <div key={item.name} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                        {item.name}
                      </span>
                      <div className="flex-1 h-5 bg-secondary rounded-sm overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-sm transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-foreground w-16 text-right">
                        {item.value.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Domains */}
      {stats.uniqueDomains.length > 1 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Domains Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.uniqueDomains.map((domain) => (
                <Badge key={domain} variant="secondary" className="text-xs">
                  {domain}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
