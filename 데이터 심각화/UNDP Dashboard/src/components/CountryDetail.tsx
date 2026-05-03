"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Target, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  getCountryDonorBreakdown,
  getCountrySectorBreakdown,
  getCountryTimeSeries,
  getCountryMetrics,
  getTopDonorsByType,
} from "../app/data-insights/recipients/actions";
import { formatCurrency, safeParseFloat } from "@/lib/utils";

interface CountryDetailProps {
  countryName: string;
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = ["#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6"];

export default function CountryDetail({
  countryName,
  isOpen,
  onClose,
}: CountryDetailProps) {
  const [donorData, setDonorData] = useState<any[]>([]);
  const [sectorData, setSectorData] = useState<any[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [topDonors, setTopDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && countryName) {
      fetchCountryDetails();
    }
  }, [isOpen, countryName]);

  const fetchCountryDetails = async () => {
    setLoading(true);
    try {
      const timeSeriesFull = await getCountryTimeSeries(countryName);

      const [donors, sectors, _, countryMetrics, topDonorsList] =
        await Promise.all([
          getCountryDonorBreakdown(countryName),
          getCountrySectorBreakdown(countryName),
          Promise.resolve(null),
          getCountryMetrics(countryName),
          getTopDonorsByType(countryName),
        ]);

      setDonorData(donors);
      setSectorData(sectors);
      setTimeSeriesData(timeSeriesFull);
      setMetrics(countryMetrics);
      setTopDonors(topDonorsList);
    } catch (error) {
      console.error("Error fetching country details:", error);
    } finally {
      setLoading(false);
    }
  };

  // === Safe sector data for pie chart ===
  const sectorPieData = useMemo(() => {
    const validSectors = sectorData
      .map((item) => ({
        name: item.sectorName?.trim() || "Other",
        value: safeParseFloat(item.funding),
      }))
      .filter((item) => item.value > 0 && !isNaN(item.value));

    const grouped: Record<string, number> = {};
    validSectors.forEach((s) => {
      grouped[s.name] = (grouped[s.name] || 0) + s.value;
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [sectorData]);

  // === Time series: 2014–2023 ===
  const timeSeriesChartData = useMemo(() => {
    const yearMap: Record<number, any> = {};
    for (let year = 2014; year <= 2023; year++) {
      yearMap[year] = { year, gender: 0, climate: 0, integrated: 0 };
    }

    timeSeriesData.forEach((item) => {
      const year = Number(item.year);
      const funding = safeParseFloat(item.funding);
      if (year < 2014 || year > 2023) return;

      if (item.bucket === "Gender Only") yearMap[year].gender = funding;
      else if (item.bucket === "Climate Only") yearMap[year].climate = funding;
      else if (item.bucket === "Integrated") yearMap[year].integrated = funding;
    });

    return Object.values(yearMap).sort((a, b) => a.year - b.year);
  }, [timeSeriesData]);

  const donorsByBucket = {
    "Gender Only": topDonors.filter((d) => d.bucket === "Gender Only"),
    "Climate Only": topDonors.filter((d) => d.bucket === "Climate Only"),
    Integrated: topDonors.filter((d) => d.bucket === "Integrated"),
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              {countryName}
            </span>
          </DialogTitle>
          <DialogDescription>
            Detailed funding analysis and donor alignment patterns
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              Loading country details...
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                icon={<Users className="w-4 h-4" />}
                label="Active Donors"
                value={metrics?.activeDonors || 0}
              />
              <MetricCard
                icon={<Target className="w-4 h-4" />}
                label="Sectors"
                value={metrics?.sectors || 0}
              />
              <MetricCard
                icon={<TrendingUp className="w-4 h-4" />}
                label="Projects"
                value={metrics?.projects || 0}
              />
              <MetricCard
                icon={<TrendingUp className="w-4 h-4" />}
                label="Integration"
                value={`${metrics?.integrationRate || 0}%`}
              />
            </div>

            {/* Top Donors — Horizontal Layout */}
            <Card className="p-4 sm:p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 tracking-tight">
                <Users className="w-5 h-5 text-blue-500" />
                Top Donors by Funding Type
              </h3>

              {/* Responsive: stacked on mobile, row on md+ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(donorsByBucket).map(([bucket, donors]) => (
                  <div key={bucket} className="flex flex-col">
                    {/* Bucket Header */}
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          bucket === "Gender Only"
                            ? "bg-purple-500"
                            : bucket === "Climate Only"
                            ? "bg-emerald-500"
                            : "bg-cyan-500"
                        }`}
                      />
                      <h4 className="font-semibold text-sm">{bucket}</h4>
                    </div>

                    {/* Column Titles */}
                    <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-2 text-[11px] text-muted-foreground tracking-wide">
                      <span className="truncate">Donor</span>
                      <span className="text-right">Projects</span>
                      <span className="text-right">Funding</span>
                    </div>

                    {/* Donor List */}
                    {donors.length > 0 ? (
                      <div className="space-y-2 mt-1 flex-1">
                        {donors.map((donor: any, idx: number) => (
                          <div
                            key={idx}
                            className="grid grid-cols-[1fr_auto_auto] gap-2 items-center text-sm px-2 py-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <span className="font-medium truncate">
                              {donor.donorName}
                            </span>

                            <Badge
                              variant="secondary"
                              className="text-xs font-medium px-1.5 py-0.5 text-center"
                            >
                              {donor.projectCount}
                            </Badge>

                            <span className="font-semibold text-right whitespace-nowrap">
                              {formatCurrency(safeParseFloat(donor.funding))}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic flex-1 flex items-center h-full py-4">
                        No donors available
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Sector Distribution — Fixed Label Overflow */}
            {sectorPieData.length > 0 && (
              <Card className="p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  Sector Distribution
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sectorPieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          labelLine={true}
                          label={({ name, percent }) =>
                            `${name}: ${((percent as number) * 100).toFixed(
                              0
                            )}%`
                          }
                        >
                          {sectorPieData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            formatCurrency(Number(value)),
                            "Funding",
                          ]}
                        />
                        <Legend
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{ paddingTop: "12px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    <h4 className="font-medium text-sm">Top Sectors</h4>
                    {sectorPieData.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="font-medium">
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Funding Timeline — Responsive Height */}
            <Card className="p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Annual Funding by Theme (2014–2023)
              </h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis
                      tickFormatter={formatCurrency}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(Number(value)),
                        "Funding",
                      ]}
                      contentStyle={{ borderRadius: "8px" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="gender"
                      name="Gender Only"
                      stroke="#b048ec"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="climate"
                      name="Climate Only"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="integrated"
                      name="Integrated"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-lg font-bold">{value}</p>
    </Card>
  );
}