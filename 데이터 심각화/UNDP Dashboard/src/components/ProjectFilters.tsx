"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface FilterOption {
  donor_name?: string;
  recipient_name?: string;
  sector_name?: string;
  count: number;
}

interface ProjectFiltersProps {
  onFilterChange: (filters: any) => void;
  filterOptions: {
    donors: FilterOption[];
    countries: FilterOption[];
    sectors: FilterOption[];
    buckets: string[];
  };
  currentFilters?: any;
}

export function ProjectFilters({
  onFilterChange,
  filterOptions,
  currentFilters = {},
}: ProjectFiltersProps) {
  const [localFilters, setLocalFilters] = useState({
    donor: currentFilters.donor || "",
    country: currentFilters.country || "",
    sector: currentFilters.sector || "",
    bucket: currentFilters.bucket || "",
    yearFrom: currentFilters.yearFrom || 2014,
    yearTo: currentFilters.yearTo || 2023,
    search: currentFilters.search || "",
  });

  // Sync local state when currentFilters prop changes (e.g., when reset is clicked)
  useEffect(() => {
    setLocalFilters({
      donor: currentFilters.donor || "",
      country: currentFilters.country || "",
      sector: currentFilters.sector || "",
      bucket: currentFilters.bucket || "",
      yearFrom: currentFilters.yearFrom || 2014,
      yearTo: currentFilters.yearTo || 2023,
      search: currentFilters.search || "",
    });
  }, [currentFilters]);
  
  const handleFilterUpdate = (key: string, value: string | number) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);

    // Remove empty values before applying
    const cleanFilters = Object.fromEntries(
      Object.entries(newFilters).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined
      )
    );

    onFilterChange(cleanFilters);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFilters = Object.fromEntries(
      Object.entries(localFilters).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined
      )
    );
    onFilterChange(cleanFilters);
  };

  return (
    <Card className="border-2">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Filter Projects</h3>
        </div>

        <form onSubmit={handleSearchSubmit} className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Projects</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by project title or description..."
                value={localFilters.search}
                onChange={(e) => handleFilterUpdate("search", e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Donor Filter */}
            <div className="space-y-2">
              <Label htmlFor="donor">Donor</Label>
              <Select
                value={localFilters.donor}
                onValueChange={(value) =>
                  handleFilterUpdate("donor", value === "all" ? "" : value)
                }
              >
                <SelectTrigger id="donor">
                  <SelectValue placeholder="All Donors" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto bg-background">
                  <SelectItem
                    value="all"
                    className="cursor-pointer hover:bg-muted focus:bg-muted"
                  >
                    All Donors
                  </SelectItem>
                  {filterOptions.donors.map((donor) => (
                    <SelectItem
                      key={donor.donor_name}
                      value={donor.donor_name!}
                      className="cursor-pointer hover:bg-muted focus:bg-muted"
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="truncate">{donor.donor_name}</span>
                        {/* <span className="text-xs text-muted-foreground ml-auto">
                          ({donor.count})
                        </span> */}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country Filter */}
            <div className="space-y-2">
              <Label htmlFor="country">Recipient</Label>
              <Select
                value={localFilters.country}
                onValueChange={(value) =>
                  handleFilterUpdate("country", value === "all" ? "" : value)
                }
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="All Recipients" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto bg-background">
                  <SelectItem
                    value="all"
                    className="cursor-pointer hover:bg-muted focus:bg-muted"
                  >
                    All Recipients
                  </SelectItem>
                  {filterOptions.countries.map((country) => (
                    <SelectItem
                      key={country.recipient_name}
                      value={country.recipient_name!}
                      className="cursor-pointer hover:bg-muted focus:bg-muted"
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="truncate">
                          {country.recipient_name}
                        </span>
                        {/* <span className="text-xs text-muted-foreground ml-auto">
                          ({country.count})
                        </span> */}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sector Filter */}
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Select
                value={localFilters.sector}
                onValueChange={(value) =>
                  handleFilterUpdate("sector", value === "all" ? "" : value)
                }
              >
                <SelectTrigger id="sector">
                  <SelectValue placeholder="All Sectors" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto bg-background">
                  <SelectItem
                    value="all"
                    className="cursor-pointer hover:bg-muted focus:bg-muted"
                  >
                    All Sectors
                  </SelectItem>
                  {filterOptions.sectors.map((sector) => (
                    <SelectItem
                      key={sector.sector_name}
                      value={sector.sector_name!}
                      className="cursor-pointer hover:bg-muted focus:bg-muted"
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="truncate">{sector.sector_name}</span>
                        {/* <span className="text-xs text-muted-foreground ml-auto">
                          ({sector.count})
                        </span> */}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bucket Filter */}
            <div className="space-y-2">
              <Label htmlFor="bucket">Integration Type</Label>
              <Select
                value={localFilters.bucket}
                onValueChange={(value) =>
                  handleFilterUpdate("bucket", value === "all" ? "" : value)
                }
              >
                <SelectTrigger id="bucket">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto bg-background">
                  <SelectItem
                    value="all"
                    className="cursor-pointer hover:bg-muted focus:bg-muted"
                  >
                    All Types
                  </SelectItem>
                  {filterOptions.buckets.map((bucket) => (
                    <SelectItem
                      key={bucket}
                      value={bucket}
                      className="cursor-pointer hover:bg-muted focus:bg-muted"
                    >
                      {bucket}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Year Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="yearFrom">Year From</Label>
              <Input
                id="yearFrom"
                type="number"
                min={2014}
                max={2023}
                value={localFilters.yearFrom}
                onChange={(e) =>
                  handleFilterUpdate("yearFrom", parseInt(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearTo">Year To</Label>
              <Input
                id="yearTo"
                type="number"
                min={2014}
                max={2023}
                value={localFilters.yearTo}
                onChange={(e) =>
                  handleFilterUpdate("yearTo", parseInt(e.target.value))
                }
              />
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}