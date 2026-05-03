"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users2, Target, MapPin, LayoutDashboard } from "lucide-react";

export default function DataInsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isOverview = pathname === "/data-insights";
  const showTabs = !isOverview;

  const getActiveTab = () => {
    if (pathname.includes("/data-insights/donors")) return "donors";
    if (pathname.includes("/data-insights/sectors")) return "sectors";
    if (pathname.includes("/data-insights/recipients")) return "recipients";
    return "overview";
  };

  const handleTabChange = (value: string) => {
    const routes: Record<string, string> = {
      overview: "/data-insights",
      donors: "/data-insights/donors",
      sectors: "/data-insights/sectors",
      recipients: "/data-insights/recipients",
    };
    router.push(routes[value]);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header: ONLY on Overview */}
      {isOverview && (
        <div className="container mx-auto px-4 md:px-8 lg:px-16 py-6">
          <div className="mb-4">
            <h1
              className="text-4xl font-extrabold tracking-tight"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, var(--semantic-climateOnly) 50%, var(--semantic-integrated) 40%, var(--semantic-genderOnly) 80%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              DEEP DATA INSIGHTS
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
              Explore gender and climate finance patterns across donors,
              sectors, and regions
            </p>
          </div>
        </div>
      )}

      {/* Sticky Tabs: ONLY on subpages */}
      {showTabs && (
        <div
          className="sticky z-40 border-b bg-background/90 backdrop-blur"
          style={{
            top: "60px", // Adjust if your navbar height differs
            borderColor: "var(--border)",
          }}
        >
          <div className="container mx-auto px-4 md:px-8 lg:px-16 py-2.5">
            <Tabs value={getActiveTab()} onValueChange={handleTabChange}>
              <TabsList className="mx-auto max-w-3xl grid grid-cols-4 p-1 rounded-xl bg-muted/50">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>

                <TabsTrigger
                  value="donors"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Users2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Donors</span>
                </TabsTrigger>

                <TabsTrigger
                  value="sectors"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Target className="w-4 h-4" />
                  <span className="hidden sm:inline">Sectors</span>
                </TabsTrigger>

                <TabsTrigger
                  value="recipients"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline">Recipients</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}
      <main className="flex-1">{children}</main>
    </div>
  );
}