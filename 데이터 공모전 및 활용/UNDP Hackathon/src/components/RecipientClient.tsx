"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import CountryDetail from "./CountryDetail";
import { Search, Trophy, Info, ChevronUp, ChevronDown, ChevronsUpDown, Eye, ArrowRight } from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, safeParseFloat, formatCount } from "@/lib/utils";

interface CountryData {
  countryName: string;
  totalFunding: string;
  genderFunding: string;
  climateFunding: string;
  integratedFunding: string;
  genderProjects: string;
  climateProjects: string;
  integratedProjects: string;
}

interface ProcessedCountry {
  country: string;
  totalFunding: number;
  genderFunding: number;
  climateFunding: number;
  integratedFunding: number;
  genderProjects: number;
  climateProjects: number;
  integratedProjects: number;
  integrationScore: number;
  rank?: number;
}

interface RecipientsClientProps {
  initialData: CountryData[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const totalProjects =
    data.genderProjects + data.climateProjects + data.integratedProjects;

  return (
    <div className="border border-border rounded-lg shadow-lg p-4 min-w-[280px]"
    style={{
        backgroundColor: 'rgb(var(--page-bg))',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <div className="flex items-center justify-center w-6 h-6 rounded bg-primary text-primary-foreground text-xs font-bold">
          {data.rank}
        </div>
        <p className="font-semibold text-sm">{data.displayName}</p>
      </div>

      {/* Total Funding */}
      <div className="mb-3 p-2 rounded bg-muted/50">
        <p className="text-xs text-muted-foreground mb-1">Total Funding</p>
        <p className="text-lg font-bold text-foreground">
          {formatCurrency(data.totalFunding)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {totalProjects} total projects
        </p>
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        {/* Gender */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#a742bb]" />
            <span className="text-muted-foreground">Gender Only</span>
          </div>
          <div className="text-right">
            <p className="font-semibold">
              {formatCurrency(data.genderFunding)}
            </p>
            <p className="text-muted-foreground">
              {formatCount(data.genderProjects)} projects
            </p>
          </div>
        </div>

        {/* Climate */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10b981]" />
            <span className="text-muted-foreground">Climate Only</span>
          </div>
          <div className="text-right">
            <p className="font-semibold">
              {formatCurrency(data.climateFunding)}
            </p>
            <p className="text-muted-foreground">
              {formatCount(data.climateProjects)} projects
            </p>
          </div>
        </div>

        {/* Integrated */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#06b6d4]" />
            <span className="text-muted-foreground">Integrated</span>
          </div>
          <div className="text-right">
            <p className="font-semibold">
              {formatCurrency(data.integratedFunding)}
            </p>
            <p className="text-muted-foreground">
              {formatCount(data.integratedProjects)} projects
            </p>
          </div>
        </div>
      </div>

      {/* Integration Score */}
      <div className="mt-3 pt-2 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Integration Score</span>
          <span className="font-semibold text-emerald-600">
            {data.integrationScore.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default function RecipientsClient({
  initialData,
}: RecipientsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showCountryDetail, setShowCountryDetail] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ProcessedCountry;
    direction: "asc" | "desc";
  } | null>(null);

  const processedData = useMemo<ProcessedCountry[]>(() => {
    return initialData
      .filter((country) => country.countryName?.trim())
      .map((country) => {
        const totalFunding = safeParseFloat(country.totalFunding);
        const genderFunding = safeParseFloat(country.genderFunding);
        const climateFunding = safeParseFloat(country.climateFunding);
        const integratedFunding = safeParseFloat(country.integratedFunding);

        const genderProjects = safeParseFloat(country.genderProjects);
        const climateProjects = safeParseFloat(country.climateProjects);
        const integratedProjects = safeParseFloat(country.integratedProjects);

        const integrationScore =
          totalFunding > 0 ? (integratedFunding / totalFunding) * 100 : 0;

        return {
          country: country.countryName.trim(),
          totalFunding,
          genderFunding,
          climateFunding,
          integratedFunding,
          genderProjects,
          climateProjects,
          integratedProjects,
          integrationScore,
        };
      });
  }, [initialData]);

  const filteredData = useMemo(() => {
    let data = processedData.filter((d) =>
      d.country.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply sorting
    if (sortConfig !== null) {
      const { key, direction } = sortConfig;
      data.sort((a, b) => {
        // Ensure values are defined (fallback to 0 / empty string) to avoid "possibly undefined"
        const va = a[key] ?? 0;
        const vb = b[key] ?? 0;

        // If either value is a string, compare as strings (handles country name)
        if (typeof va === "string" || typeof vb === "string") {
          const res = String(va).localeCompare(String(vb));
          return direction === "asc" ? res : -res;
        }

        // Otherwise compare as numbers
        if (va < vb) return direction === "asc" ? -1 : 1;
        if (va > vb) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [processedData, searchTerm, sortConfig]);

  const chartData = useMemo(() => {
    return [...filteredData]
      .sort((a, b) => b.totalFunding - a.totalFunding)
      .slice(0, 10)
      .map((country, index) => ({
        ...country,
        rank: index + 1,
        displayName: `#${index + 1} ${country.country}`,
      }));
  }, [filteredData]);

  const handleCountryClick = (country: string) => {
    setSelectedCountry(country);
    setShowCountryDetail(true);
  };

  const getIntegrationColor = (score: number) => {
    if (score >= 40) return "#10b981";
    if (score >= 20) return "#f59e0b";
    return "#d64040";
  };

  const requestSort = (key: keyof ProcessedCountry) => {
    let direction: "asc" | "desc" = "desc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "desc"
    ) {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  

  
  return (
    <div className="space-y-4">
      {/* Country Detail Modal */}
      {selectedCountry && (
        <CountryDetail
          countryName={selectedCountry}
          isOpen={showCountryDetail}
          onClose={() => setShowCountryDetail(false)}
        />
      )}

      {/* Enhanced Chart */}
      <Card className="p-4">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-bold">
              Top 10 Recipient Countries by Total ODA Funding
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Stacked bars show funding distribution across Gender, Climate, and
            Integrated themes. Hover for detailed breakdown including project
            counts.
          </p>
        </div>

        <div
          className="w-full"
          style={{
            height: `${Math.min(500, Math.max(200, chartData.length * 48))}px`,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 180, bottom: 40 }}
              barSize={22}
              barGap={2}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                opacity={0.2}
                horizontal={true}
                vertical={false}
              />

              <XAxis
                type="number"
                tickFormatter={formatCurrency}
                tick={{ fill: "var(--axis-color)", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
              />

              <YAxis
                dataKey="displayName"
                type="category"
                width={170}
                tick={(props) => {
                  const { x, y, payload } = props;
                  return (
                    <text
                      x={x - 10}
                      y={y + 4}
                      textAnchor="end"
                      style={{
                        fill: "var(--axis-color)",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      {payload.value}
                    </text>
                  );
                }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
              />

              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: "20px" }}
              />

              <Bar
                dataKey="genderFunding"
                name="Gender Only"
                stackId="funding"
                fill="#a742bb"
              />
              <Bar
                dataKey="climateFunding"
                name="Climate Only"
                stackId="funding"
                fill="#10b981"
              />
              <Bar
                dataKey="integratedFunding"
                name="Integrated"
                stackId="funding"
                fill="#06b6d4"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Footnote for "Bilateral, unspecified" */}
        <div className="text-xs text-muted-foreground italic max-w-4xl">
          <span className="font-medium">Note:</span> “Bilateral, unspecified”
          refers to funding reported by a donor country that is not allocated to
          any specific recipient country.
        </div>
      </Card>

      {/* Search */}
      <Card className="p-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Country Table — with Sortable Headers */}
      <Card className="p-4">
        <h3 className="text-base font-semibold mb-3">All Recipients</h3>

        <p className="text-sm text-muted-foreground mb-4 max-w-5xl leading-relaxed">
          <span className="font-medium text-foreground">
            Sorted by total funding
          </span>{" "}
          (highest to lowest) by default. Click any column header to re-sort —
          explore which countries lead in gender, climate, or integrated
          funding.
          <br className="hidden sm:block" />
          <span className="inline-flex items-center gap-1.5 mt-1.5 text-sm">
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
            Click a country row to view detailed insights
          </span>
        </p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {(
                  [
                    { key: "country", label: "Country", align: "left" },
                    {
                      key: "totalFunding",
                      label: "Total Funding",
                      align: "right",
                    },
                    { key: "genderProjects", label: "Gender", align: "right" },
                    {
                      key: "climateProjects",
                      label: "Climate",
                      align: "right",
                    },
                    {
                      key: "integratedProjects",
                      label: "Integrated",
                      align: "right",
                    },
                    {
                      key: "integrationScore",
                      label: "Integration %",
                      align: "right",
                      hasInfo: true,
                    },
                  ] as const
                ).map((col) => {
                  const { key, label, align, hasInfo } = col as any;
                  const isActive = sortConfig?.key === key;
                  const isAsc = isActive && sortConfig?.direction === "asc";

                  return (
                    <th
                      key={key}
                      className={`p-2 font-semibold text-sm cursor-pointer group transition-colors ${
                        align === "right" ? "text-right" : "text-left"
                      } ${
                        isActive
                          ? "text-primary font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => requestSort(key)}
                      title={`Sort by ${label}`}
                    >
                      <div
                        className={`inline-flex items-center gap-1 ${
                          align === "right" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {label}
                        {hasInfo && (
                          <span className="text-xs font-bold text-muted-foreground border border-border rounded-full w-4 h-4 flex items-center justify-center leading-none">
                            i
                          </span>
                        )}
                        {isActive ? (
                          isAsc ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-70 transition-opacity" />
                        )}
                      </div>

                      {/* Integration % Tooltip */}
                      {hasInfo && (
                        <div className="absolute hidden group-hover:block right-0 top-full mt-2 w-64 bg-background border border-border shadow-lg rounded-lg p-3 z-50 text-xs">
                          <p className="font-semibold mb-1">
                            Integration % Logic
                          </p>
                          <p className="text-muted-foreground mb-2">
                            Share of funding dedicated to integrated Gender +
                            Climate initiatives.
                          </p>
                          <div className="space-y-1 text-foreground">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#10b981]" />{" "}
                              ≥ 40% – Highly Integrated
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />{" "}
                              20–39% – Moderate
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#d64040]" />{" "}
                              ↓ 20% – Low Integration
                            </div>
                          </div>
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((country, idx) => (
                <tr
                  key={idx}
                  className="border-b hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => handleCountryClick(country.country)}
                >
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="font-medium px-2 py-1"
                      >
                        {country.country}
                      </Badge>

                      {/* Clickable Indicator */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px]">View details</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </td>
                  <td className="p-2 text-right font-medium text-sm">
                    {formatCurrency(country.totalFunding)}
                  </td>
                  <td className="p-2 text-right text-sm">
                    {formatCount(country.genderProjects)}
                  </td>
                  <td className="p-2 text-right text-sm">
                    {formatCount(country.climateProjects)}
                  </td>
                  <td className="p-2 text-right text-sm">
                    {formatCount(country.integratedProjects)}
                  </td>
                  <td className="p-2 text-right">
                    <span
                      style={{
                        color: getIntegrationColor(country.integrationScore),
                      }}
                      className="font-semibold text-xs"
                    >
                      {country.integrationScore.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}