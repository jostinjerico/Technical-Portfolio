"use client";

import Link from "next/link";
import {
  Globe2,
  BarChart3,
  BookOpen,
  LineChart,
  Layers,
  FolderSearch,
  Info 
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [stats, setStats] = useState({
    years: "10",
    countries: "150+",
    donors: "115+",
    projects: "570K+",
  });

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(console.error);
  }, []);

  return (
    <main className="min-h-screen">
      
    {/* HERO */}
    <section className="relative overflow-hidden bg-gradient-mesh">
      {/* existing overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-background/60 to-background" />

      {/* hero content */}
      <div className="relative z-10 w-full flex justify-center px-6 sm:px-10 lg:px-16 py-10 md:py-14">
        <div className="w-full max-w-6xl text-center space-y-6">
          <h1 className="text-5xl md:text-8xl font-poppins font-bold tracking-tight">
            <span className="text-gradient">EcoEquity</span>
          </h1>

          <p className="text-3xl md:text-4xl text-muted-foreground font-medium max-w-11xl mx-auto mb-6">
            <span className="text-gradient">Integration Intelligence Platform for Gender–Climate Funding Analysis</span>
          </p>
          <p className="text-bas mb-12 md:text-lg text-primary leading-snug max-w-3xl mx-auto">
            Turning gender and climate data into actionable development insights.
          </p>  

          {/* Secondary CTAs (optional) */}
          <div className="mt-8 mb-1 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/dashboard"     className="
                btn-eco
                inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium
                text-primary-foreground
                border-neutral-200 dark:border-neutral-700
                transition-all duration-300 hover:-translate-y-1 hover:shadow-lg
                hover:ring-ring/20 
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2
                cursor-pointer
              ">
                Explore Strategic Dashboard
              </Link>
              <Link href="/data-insights"     className="
                btn-eco
                inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium
                text-primary-foreground
                border-neutral-200 dark:border-neutral-700
                transition-all duration-300 hover:-translate-y-1 hover:shadow-lg
                hover:ring-ring/20 
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2
                cursor-pointer
              ">
                Discover Gender and Climate Synergies
              </Link>
              <Link href="/projects"     className="
                btn-eco
                inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium
                border-neutral-200 dark:border-neutral-700
                hover:-translate-y-1 hover:shadow-lg
                hover:ring-ring/20 
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2
                cursor-pointer
              ">
                Browse Projects Database
              </Link>
          </div>
        </div>
      </div>
    </section>

    {/* ========== WHAT IS ECOEQUITY SECTION ========== */}
    <section id="what-is-ecoequity" className="py-6 md:py-6  border-y border-neutral-200/60 dark:border-neutral-100/20">
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <div className="space-y-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold">
            Our Mission & Vision
            </h2>

            <p className="text-primary text-lg leading-relaxed">
             <strong>Under 5%</strong> of the OECD CRS dataset includes both gender and climate markers — 
              signaling a powerful but underutilized synergy.
            </p>

            <p className="text-primary text-lg leading-relaxed">
              To address this, EcoEquity provides {" "}
              <strong>descriptive analytics and strategic insights</strong>{" "}
              to reveal integration patterns enabling data transparency, improving aid coordination and
              surface collaboration opportunities. This platform suppports SDG 5, SDG 13 and SDG 17 by improving 
              data transparency and donor coordination
            </p>

            <p className="text-primary text-lg leading-relaxed">
              The result is a unified system that offers actionable dashboards, donor and recipient profile analysis
              to strengthen UNDP’s evidence-based programming — ensuring transparency, accountability, and
              data-driven coordination in international aid.
            </p>
          </div>
         </div>

         <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4 py-10 md:py-10">
            <Button
              asChild
              size="lg"
              variant="outline"
              className="
              inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium
              border-neutral-200 dark:border-neutral-700
              transition-all duration-300 hover:-translate-y-1 hover:shadow-lg
              hover:ring-ring/20 
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2
              cursor-pointer
              "
            >
              <Link href="/about">Read More</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground flex items-center justify-center gap-1">
        <Info className="h-3.5 w-3.5" />
        Source: OECD CRS (2013–2023). Statistics reflects EcoEquity analysis; methods in the “About” page.
      </p>
      
    </section>
     
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen
        pt-12 md:pt-16 pb-20 md:pb-28 
        border-y">

        <div className="max-w-screen-xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center">
            Key Capabilities
          </h2>

          {/* Grid with 3 top + 3 bottom */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-8 items-stretch">
            {[
              {
                icon: Layers,
                title: "Data Quality Safeguards",
                desc: "Ensuring marker consistency and handling missing values with NLP validation.",
              },
              {
                icon: BarChart3,
                title: "Integration Mapping",
                desc: "Visualizing gender–climate integration by donor, country, and sector.",
              },
              {
                icon: Globe2,
                title: "Country & Donor Profiles",
                desc: "Providing transparent insights through dashboards and scorecards.",
              },
              {
                icon: BookOpen,
                title: "Policy Insights",
                desc: "Creating briefs and opportunity maps for coordination and SDG alignment.",
              },
              {
                icon: LineChart,
                title: "Academic Research Track",
                desc: "Parallel predictive analytics research informing future UNDP modeling.",
              },
              {
                icon: FolderSearch,
                title: "Project Information",
                desc: "Interactive explorer for project-level ODA: filter by donor, recipient, sector, and timeframe; review funding and gender–climate integration.",
              },
            ].map((item, i) => (
              <Card
                key={i}
                className="group h-full flex hover:shadow-xl hover:-translate-y-1 transition-all-smooth
                          border-neutral-200 dark:border-neutral-700 w-full max-w-[360px]"
              >
                <CardContent className="pt-7 text-center space-y-4 bg-muted/40">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto shadow-lg
                    bg-gradient-to-br from-primary-500 to-primary-600
                    dark:from-emerald-500 dark:to-teal-600">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-primary leading-relaxed">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    
    {/* ========== UNDP SNAPSHOT ========== */}
      <footer id="undp-snapshot" className="bg-muted/10">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 text-center">
          <h2 className="text-s uppercase tracking-widest text-primary">
          Global Development Data in Perspective
          </h2>
          <p className="text-primary text-s leading-relaxed md:py-8 text-center">
              Built on OECD’s Official Development Assistance (ODA) data, this platform traces how international aid investments intersect with gender equality and climate resilience. 
              It enables data-driven insights into funding priorities, emerging patterns, and cross-sector synergies.
            </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
            {[
              { label: "Years of Data", value: stats.years },
              { label: "Countries", value: stats.countries },
              { label: "Donors", value: stats.donors },
              { label: "Projects", value: stats.projects },
            ].map((s, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-muted/40 backdrop-blur-sm border-neutral-200 dark:border-neutral-700 ring-1 ring-white/20 dark:ring-white/10 hover:-translate-y-0.5 transition"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {s.value}
                </div>
                <div className="text-xs md:text-sm text-primary mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
    </footer>
    </main>
  );
}