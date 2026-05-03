"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProjectFilters } from "@/components/ProjectFilters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber, formatNumberRounded } from "@/lib/utils";
import { getProjects, getFilterOptions } from "./actions";
import { Project } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import {
  Download,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Building2,
  FileDown,
  Target,
  Trophy,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {exportToCSV } from "@/lib/utils"

interface Filters {
  donor?: string;
  country?: string;
  sector?: string;
  bucket?: string;
  yearFrom?: number;
  yearTo?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortField?: "year" | "usd_disbursement" | "bucket";
  sortDirection?: "asc" | "desc";
}

const DEFAULT_FILTERS: Filters = {
  page: 1,
  limit: 20,
  sortField: undefined, 
  sortDirection: "asc",
};


export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState({
    field: null,
    direction: "asc",
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [projectsData, options] = await Promise.all([
          getProjects(filters),
          getFilterOptions(),
        ]);
        setProjects(projectsData.projects);
        setTotal(projectsData.total);
        setTotalPages(projectsData.totalPages);
        setFilterOptions(options);
      } catch (error) {
        console.error("Error loading projects:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [filters]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters({ ...newFilters, page: 1, limit: filters.limit });
  };

  const handleResetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
  };

  const removeFilter = (key: keyof Filters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters({ ...newFilters, page: 1 });
  };

  const hasActiveFilters = () => {
    return Boolean(
      filters.donor ||
        filters.country ||
        filters.sector ||
        filters.bucket ||
        filters.search ||
        (filters.yearFrom && filters.yearFrom !== 2014) ||
        (filters.yearTo && filters.yearTo !== 2023)
    );
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExportCurrentPage = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    exportToCSV(
      projects,
      `projects-page-${filters.page || 1}-${timestamp}.csv`
    );
  };

  const handleExportAll = async () => {
    try {
      setLoading(true);
      const allData = await getProjects({ ...filters, limit: total });
      exportToCSV(
        allData.projects,
        `projects-all-${new Date().toISOString().split("T")[0]}.csv`
      );
    } catch (error) {
      console.error("Error exporting all projects:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats for current page
  const getTopSector = () => {
    const sectorCounts = projects.reduce((acc, p) => {
      const sector = p.sector_name || "Unknown";
      acc[sector] = (acc[sector] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topSector = Object.entries(sectorCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];
    return topSector ? topSector[0] : "N/A";
  };

  const getTopRecipient = () => {
    const recipientAmounts = projects.reduce((acc, p) => {
      acc[p.recipient_name] = (acc[p.recipient_name] || 0) + p.usd_disbursement;
      return acc;
    }, {} as Record<string, number>);

    const topRecipient = Object.entries(recipientAmounts).sort(
      (a, b) => b[1] - a[1]
    )[0];
    return topRecipient ? topRecipient[0] : "N/A";
  };

  const getIntegrationRate = () => {
    const integratedCount = projects.filter(
      (p) => p.bucket === "Integrated"
    ).length;
    const percentage =
      projects.length > 0
        ? ((integratedCount / projects.length) * 100).toFixed(0)
        : 0;
    return `${percentage}%`;
  };

  const handleSort = (field: "year" | "usd_disbursement" | "bucket") => {
    setFilters((prev) => ({
      ...prev,
      sortField: field,
      sortDirection:
        prev.sortField === field && prev.sortDirection === "asc"
          ? "desc"
          : "asc",
      page: 1, 
    }));
  };

  if (loading && !projects.length) {
    return (
      <div className="container mx-auto px-4 py-12 ">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Projects",
      value: formatNumber(total),
      icon: BarChart3,
      color: "text-[rgb(var(--sem-integrated))]",
      bgColor: "bg-[rgb(var(--sem-integrated)/0.15)] ring-1 ring-[rgb(var(--sem-integrated)/0.25)]",
      info: "Total number of projects matching your filters",
    },
    {
      title: "Top Sector",
      value: getTopSector(),
      icon: Trophy,
      color: "text-[rgb(var(--sem-climate))]",
    // was: bg-emerald-50 dark:bg-emerald-950/30
      bgColor: "bg-[rgb(var(--sem-climate)/0.15)] ring-1 ring-[rgb(var(--sem-climate)/0.25)]",
      info: "Most common sector in current filtered results",
      badge: "Current Page",
    },
    {
      title: "Top Recipient",
      value: getTopRecipient(),
      icon: Building2,
      color: "text-[rgb(var(--sem-gender))]",
    // was: bg-violet-50 dark:bg-violet-950/30
      bgColor: "bg-[rgb(var(--sem-gender)/0.15)] ring-1 ring-[rgb(var(--sem-gender)/0.25)]",
      info: "Country receiving the most funding on this page",
      badge: "Current Page",
    },
    {
      title: "Integration Rate",
      value: getIntegrationRate(),
      icon: Target,
      color: "text-amber-600 dark:text-amber-400",
      // was: bg-amber-50 dark:bg-amber-950/30
      bgColor: "bg-amber-500/12 ring-1 ring-amber-500/25 dark:bg-amber-400/20 dark:ring-amber-400/30",
      info: "Percentage of projects with integrated gender & climate focus",
      badge: "Current Page",
    },
  ];



  return (
    <div className="container mx-auto px-4 py-4 space-y-2">
      {/* Header Section */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">
            Projects Database
          </h1>
          <p className="text-md text-muted-foreground max-w-3xl">
            Explore and filter over 700K gender, climate, and integrated
            development projects. Search by donor, recipient, sector, or
            integration type to find specific projects or trends.
          </p>
        </div>

        {/* Action Buttons with Clear Tooltips */}
        <div className="flex items-start gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleResetFilters}
                disabled={loading}
                aria-label="Reset all filters"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset all filters</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Export data as CSV"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export as CSV</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={handleExportCurrentPage}
                className="cursor-pointer"
              >
                <FileDown className="w-4 h-4 mr-2" />
                <div className="flex flex-col">
                  <span className="font-medium">Current Page</span>
                  <span className="text-xs text-muted-foreground">
                    {projects.length} projects
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportAll}
                className="cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2" />
                <div className="flex flex-col">
                  <span className="font-medium">All Filtered Results</span>
                  <span className="text-xs text-muted-foreground">
                    {formatNumberRounded(total)} projects
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsData.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card
              key={i}
              className="hover:shadow-lg transition-all duration-300 border-border/10 relative group"
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1 min-w-0">
                    <p
                      className="font-medium text-muted-foreground text-sm leading-snug line-clamp-2 break-words"
                      title={stat.title}
                    >
                      {stat.title}
                    </p>

                    {/* Metric value stays bold + clean */}
                    <p
                      className="text-2xl font-bold tracking-tight"
                      title={stat.value}
                    >
                      {stat.value}
                    </p>

                    {/* Badge stays static position under number */}
                    {stat.badge && (
                      <Badge
                        variant="outline"
                        className="text-xs font-normal mt-1"
                        title={stat.badge}
                      >
                        {stat.badge}
                      </Badge>
                    )}
                  </div>

                  <div
                    className={`p-3 rounded-lg flex-shrink-0 ${stat.bgColor}`}
                  >
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters Section */}
      {filterOptions && (
        <ProjectFilters
          onFilterChange={handleFilterChange}
          filterOptions={filterOptions}
          currentFilters={filters}
        />
      )}

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <Card className="border-primary/30 bg-muted/90 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  Active Filters:
                </span>
                {filters.donor && (
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                    <span className="text-xs font-normal text-muted-foreground">
                      Donor:
                    </span>
                    <span className="font-medium">{filters.donor}</span>
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors"
                      onClick={() => removeFilter("donor")}
                    />
                  </Badge>
                )}
                {filters.country && (
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                    <span className="text-xs font-normal text-muted-foreground">
                      Recipient:
                    </span>
                    <span className="font-medium">{filters.country}</span>
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors"
                      onClick={() => removeFilter("country")}
                    />
                  </Badge>
                )}
                {filters.sector && (
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                    <span className="text-xs font-normal text-muted-foreground">
                      Sector:
                    </span>
                    <span className="font-medium">{filters.sector}</span>
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors"
                      onClick={() => removeFilter("sector")}
                    />
                  </Badge>
                )}
                {filters.bucket && (
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                    <span className="text-xs font-normal text-muted-foreground">
                      Type:
                    </span>
                    <span className="font-medium">{filters.bucket}</span>
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors"
                      onClick={() => removeFilter("bucket")}
                    />
                  </Badge>
                )}
                {filters.search && (
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                    <span className="text-xs font-normal text-muted-foreground">
                      Search:
                    </span>
                    <span className="font-medium">{filters.search}</span>
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors"
                      onClick={() => removeFilter("search")}
                    />
                  </Badge>
                )}
                {((filters.yearFrom && filters.yearFrom !== 2014) ||
                  (filters.yearTo && filters.yearTo !== 2023)) && (
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                    <span className="text-xs font-normal text-muted-foreground">
                      Years:
                    </span>
                    <span className="font-medium">
                      {filters.yearFrom || 2014} - {filters.yearTo || 2023}
                    </span>
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors"
                      onClick={() => {
                        removeFilter("yearFrom");
                        removeFilter("yearTo");
                      }}
                    />
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects Table */}
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">Project Listings</CardTitle>
              <CardDescription className="text-sm">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {projects.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {formatNumber(total)}
                </span>{" "}
                projects
                {filters.page && filters.page > 1 && (
                  <span className="ml-1">
                    · Page{" "}
                    <span className="font-semibold text-foreground">
                      {filters.page}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-foreground">
                      {totalPages}
                    </span>
                  </span>
                )}
              </CardDescription>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50 border-b">
                  <TableHead className="font-semibold h-12">
                    Project Title
                  </TableHead>
                  <TableHead className="font-semibold h-12">Donor</TableHead>
                  <TableHead className="font-semibold h-12">
                    Recipient
                  </TableHead>
                  <TableHead className="font-semibold h-12">Sector</TableHead>
                  {/* Year Column - Sortable */}
                  <TableHead
                    className="font-semibold h-12 text-center cursor-pointer hover:bg-muted/80 transition-colors select-none"
                    onClick={() => handleSort("year")}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Year
                      {filters.sortField === "year" ? (
                        filters.sortDirection === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableHead>
                  {/* Funding Column - Sortable */}
                  <TableHead
                    className="font-semibold h-12 text-right cursor-pointer hover:bg-muted/80 transition-colors select-none"
                    onClick={() => handleSort("usd_disbursement")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Funding (USD)
                      {filters.sortField === "usd_disbursement" ? (
                        filters.sortDirection === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableHead>
                  {/* Integration Column - Sortable */}
                  <TableHead
                    className="font-semibold h-12 text-center cursor-pointer hover:bg-muted/80 transition-colors select-none"
                    onClick={() => handleSort("bucket")}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Integration
                      {filters.sortField === "bucket" ? (
                        filters.sortDirection === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <BarChart3 className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">No projects found</p>
                          <p className="text-sm text-muted-foreground">
                            Try adjusting your filters to see more results
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((project) => (
                    <TableRow
                      key={project.id}
                      className="hover:bg-muted/30 transition-colors border-b last:border-0"
                    >
                      <TableCell className="font-semibold max-w-xs">
                        {project.project_title ? (
                          <Tooltip >
                            <TooltipTrigger asChild>
                              <div className="truncate cursor-pointer">
                                {project.project_title}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              align="start"
                              className="max-w-xs p-3 text-foreground border border-border shadow-lg cursor-pointer"
                              style={{
                                    backgroundColor: 'rgb(var(--page-bg))',
                                  }}
                            >
                              <p className="font-semibold mb-1 ">
                                {project.project_title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {project.long_description ||
                                  "No description available."}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground italic">
                            Untitled Project
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground select-none">
                        {project.donor_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground select-none">
                        {project.recipient_name}
                      </TableCell>
                      <TableCell className="max-w-xs text-muted-foreground select-none">
                        <div className="truncate" title={project.sector_name}>
                          {project.sector_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground select-none">
                        {project.year}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums select-none">
                        {formatCurrency(project.usd_disbursement)}
                      </TableCell>
                      <TableCell className="text-center select-none">
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex px-3 py-1.5 rounded-full text-xs font-medium font-semibold whitespace-nowrap ${
                              project.bucket === "Integrated"
                              ? "bg-[rgb(var(--sem-integrated)/var(--chip-alpha))] text-[rgb(var(--integrated-text-color))] ring-1 ring-[rgb(var(--sem-integrated)/var(--chip-ring-alpha))] shadow-[inset_0_-1px_0_0_rgba(255,255,255,.25)] saturate-125"
                            : project.bucket === "Gender Only"
                              ? "bg-[rgb(var(--sem-gender)/var(--chip-alpha))] text-[rgb(var(--gender-text-color))] ring-1 ring-[rgb(var(--sem-gender)/var(--chip-ring-alpha))] shadow-[inset_0_-1px_0_0_rgba(255,255,255,.25)] saturate-125"
                            : project.bucket === "Climate Only"
                              ? "bg-[rgb(var(--sem-climate)/var(--chip-alpha))] text-[rgb(var(--integrated-text-color))] ring-1 ring-[rgb(var(--sem-climate)/var(--chip-ring-alpha))] shadow-[inset_0_-1px_0_0_rgba(255,255,255,.25)] saturate-125"
                            : "bg-muted/40 text-foreground/70 ring-1 ring-border/30"
                            }`}
                          >
                            {project.bucket}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
              <p className="text-sm text-muted-foreground">
                Page{" "}
                <span className="font-medium text-foreground">
                  {filters.page || 1}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {totalPages}
                </span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                  disabled={!filters.page || filters.page <= 1 || loading}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
                  disabled={
                    !filters.page || filters.page >= totalPages || loading
                  }
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}