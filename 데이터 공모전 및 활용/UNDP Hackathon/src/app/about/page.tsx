"use client";

import Link from "next/link";
import {
  ArrowRight,
  Target,
  TrendingUp,
  Users,
  Globe,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Layers,
  Globe2,
  BookOpen,
  Brain,
  LineChart,
  Database,
  Linkedin,
  Link as LinkIcon,
  Tags,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RationaleDialog } from "@/components/RationaleDialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default function AboutPage() {
  const [activeHelp, setActiveHelp] = useState<
    null | "quality" | "undp" | "ecoequity" | "viz"
  >(null);
  return (
    <main className="min-h-screen">
      {/* ========== HERO SECTION ========== */}
      <section className="relative overflow-hidden bg-gradient-mesh">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background pointer-events-none" />
        <div className="relative w-full flex justify-center px-6 sm:px-10 lg:px-16 pt-24 pb-20 md:pt-32 md:pb-24">
          <div className="w-full max-w-5xl text-center space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gradient mt-2 leading-tight md:leading-[1.1]">
              Gender × Climate Intelligence
            </h1>
            <p className=" text-lg leading-relaxed">
              EcoEquity is a data intelligence platform developed to strengthen gender–climate integration within global development aid. 
              Built for UNDP’s Data Dive for Development 2025, the platform addresses a critical data gap — less than 5% of projects in 
              the OECD CRS database include both gender and climate markers.
            </p>
            <p className=" text-lg leading-relaxed">
              Through advanced analytics, EcoEquity helps UNDP and partners visualize integration patterns, identify data inconsistencies,
              and map donor collaboration opportunities. The tool aligns with UNDP’s priorities of gender equality (SDG 5) and climate action (SDG 13),
              enabling evidence-based coordination and more effective cross-sector funding strategies.
            </p>
            <p className="text-lg leading-relaxed">
              Ultimately, EcoEquity aims to move beyond siloed aid analysis by delivering actionable insights — helping donors 
              and policymakers pinpoint where intersectional investments can achieve the greatest impact.
            </p>
              <div className="flex items-center justify-center gap-3 pt-2 mt-2 mb-2">
                <RationaleDialog />
              </div>
          </div>
        </div>
      </section>

    {/* --- Methodology --- */}
    <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen pt-6 pb-12 md:pt-6 md:pb-16">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 text-center space-y-8">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How EcoEquity Works</h2>
        <p className="text-base md:text-lg text-primary max-w-3xl mx-auto">
          A simple flow: we clean the data, find the real gender × climate links, then show clear actions.
        </p>

        {/* 3-Step explainer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          {/* Step 1 */}
          <div className="relative rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-muted/90 backdrop-blur p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 font-semibold">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs">1</span>
                Gather & Clean
              </span>
              <Database className="w-4 h-4 opacity-70" />
            </div>
            <p className="text-sm text-primary mt-2">
              We combine OECD CRS with complementary sources and fix gaps or inconsistencies in gender
              and climate markers so the analysis is trustworthy.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 text-xs" style={{color:"var(--semantic-climateOnly)"}}>
              <ShieldCheck className="w-4 h-4" /> 
              <strong>Quality checks & imputation</strong>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-muted/90 backdrop-blur p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 font-semibold">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs">2</span>
                Detect Integration
              </span>
              <Brain className="w-4 h-4 opacity-70" />
            </div>
            <p className="text-sm text-primary mt-2">
              We read project text (NLP) and markers to score gender–climate integration and group donors
              by behavior to reveal patterns.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 text-xs" 
            style={{color:"var(--semantic-climateOnly)"}}>
              <BarChart3 className="w-4 h-4" /> <strong>Integration scores & donor clusters</strong>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-muted/90 backdrop-blur p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 font-semibold">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs">3</span>
                Share Clear Actions
              </span>
              <Layers className="w-4 h-4 opacity-70" />
            </div>
            <p className="text-sm text-primary mt-2">
              We turn findings into maps, donor profiles, and opportunity briefs so teams can coordinate
              and target integrated projects.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 text-xs"style={{color:"var(--semantic-climateOnly)"}} >
              <Globe2 className="w-4 h-4" /> <strong>Maps, scorecards, opportunity views</strong>
            </div>
          </div>
        </div>

        {/* What you’ll see */}
        <div className="text-left pt-4">
          <h3 className="text-lg font-semibold mb-2">What you’ll see</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-primary">
            <li className="flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500" /> Countries where gender × climate integration is strong or missing</li>
            <li className="flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500" /> Donor archetypes that behave similarly</li>
            <li className="flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500" /> Project text signals that support or challenge reported markers</li>
            <li className="flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500" /> Actionable briefs and coordination opportunities</li>
          </ul>
        </div>

        {/* Inputs → Outputs mini-summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-4">
          <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-muted/90 backdrop-blur p-6 shadow-sm">
            <h4 className="font-semibold flex items-center gap-2">
              <Database className="w-4 h-4" /> What goes in
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-primary">
              <li>OECD CRS (gender & climate markers)</li>
              <li>Project descriptions (for NLP)</li>
              <li>World Bank indicators, UN Comtrade, SDG progress (context)</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-muted/90 backdrop-blur p-6 shadow-sm">
            <h4 className="font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> What comes out
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-primary">
              <li>Integration scores and donor reliability checks</li>
              <li>Donor clusters and country/sector opportunity maps</li>
              <li>Dashboards, scorecards, and exportable briefs</li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-6">
          <Button
            asChild
            size="lg"
            className="bg-gradient-primary hover:bg-gradient-accent shadow-glow-primary transition-all-smooth"
          >
            <Link href="https://github.com/hayat711/UNDP_Dashboard" target="_blank" rel="noreferrer">
              <Database className="mr-2 w-5 h-5" />
              More Information on GitHub
            </Link>
          </Button>
        </div>
      </div>
    </section>

    {/* --- HELP / LEARN MORE --- */} <section className="w-full py-20 md:py-18 bg-gradient-to-b from-transparent via-background/40 to-background dark:from-transparent dark:via-background/20 dark:to-background border-t border-neutral-200/60 dark:border-neutral-800/60"> <div className="max-w-6xl mx-auto px-6 sm:px-10 text-center space-y-12"> <div className="space-y-4"> <h2 className="text-3xl md:text-4xl font-bold">Resource Center</h2> <p className="text-muted-foreground text-lg max-w-5xl mx-auto"> Learn how EcoEquity interprets gender–climate integration, how markers are handled, and how to read the dashboards. </p> </div> <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"> 
      {/* Shared card style */}
      {/* --- Data Quality --- */}
      <button onClick={() => setActiveHelp("quality")} className="group flex flex-col text-left p-6 rounded-2xl bg-muted/90 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg
    hover:ring-1 hover:ring-ring/40 hover:bg-accent/10
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2
    cursor-pointer"      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg mb-4">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">Data Quality</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            How we validate CRS data, treat missingness, and check donor consistency.
          </p>
        </div>
      </button>

      {/* --- UNDP / CRS Data Fields --- */}
      <button onClick={() => setActiveHelp("undp")} className="group flex flex-col text-left p-6 rounded-2xl bg-muted/90 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg
          hover:ring-1 hover:ring-ring/40 hover:bg-accent/10
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2
          cursor-pointer" >
        {/* Icon block — SAME FORMAT AS ECO EQUITY MARKERS */}
        <div className="
          w-12 h-12 rounded-xl
          bg-gradient-to-br from-blue-500 to-blue-600
          dark:from-blue-500 dark:to-emerald-600
          flex items-center justify-center shadow-lg mb-4
        ">
          <BookOpen className="w-6 h-6 text-white" />
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold text-lg">Data Fields Glossary</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Glossary of UNDP/CRS data fields used in the dashboards: donors, recipients, sectors, markers, amounts, and more.
          </p>
        </div>
      </button>


      {/* --- EcoEquity Markers --- */}
      <button onClick={() => setActiveHelp("ecoequity")} className="group flex flex-col text-left p-6 rounded-2xl bg-muted/90 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg
    hover:ring-1 hover:ring-ring/40 hover:bg-accent/10
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2
    cursor-pointer"      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-600 flex items-center justify-center shadow-lg mb-4">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">EcoEquity Markers</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Our Integration Score (markers + NLP) and donor archetypes: integrators, specialists, sequential builders.
          </p>
        </div>
      </button>

      {/* --- Visualizations & Graphs --- */}
      <button onClick={() => setActiveHelp("viz")} className="group flex flex-col text-left p-6 rounded-2xl bg-muted/90 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg
    hover:ring-1 hover:ring-ring/40 hover:bg-accent/10
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2
    cursor-pointer"      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg mb-4">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">Visualizations & Graphs</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            How to read integration maps, donor profiles, and opportunity views.
          </p>
        </div>
      </button>
      </div> </div> </section>
    <Dialog
      open={!!activeHelp}
      onOpenChange={(open) => {
        if (!open) setActiveHelp(null);
      }}
    >
      <DialogContent className="max-w-xl sm:max-w-2xl bg-background/95 backdrop-blur-md border border-neutral-800/60 z-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {activeHelp === "quality" && "Data Quality"}
            {activeHelp === "undp" && "UNDP Markers"}
            {activeHelp === "ecoequity" && "EcoEquity Markers"}
            {activeHelp === "viz" && "Visualizations & Graphs"}
          </DialogTitle>

          <DialogDescription className="text-muted-foreground text-sm">
            {activeHelp === "quality" &&
              "How we validate data, deal with gaps, and ensure donor reliability."}
            {activeHelp === "undp" &&
              "How gender and climate markers are assigned across projects."}
            {activeHelp === "ecoequity" &&
              "How we define integration beyond raw CRS markers."}
            {activeHelp === "viz" &&
              "How to read the maps, profiles, and opportunity views."}
          </DialogDescription>
        </DialogHeader>

        {/* Body content below */}
        <div className="text-muted-foreground text-sm leading-relaxed space-y-4 mt-4 overflow-y-auto flex-1 pr-2">
        {/* --- Visualization Help --- */}
          {activeHelp === "viz" && (
          <>
            <p className="text-foreground/90">
              EcoEquity uses several types of visualizations to turn raw data into
              insights. Each graph style serves a specific purpose — from comparing
              volumes to tracking trends and showing intersections.
            </p>

            {/* Overview of graph types */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 text-left">
              <div className="eco-modal-panel p-4 shadow-sm">
                <h4 className="font-semibold text-foreground mb-1">📊 Bar Graph</h4>
                <p className="text-sm text-muted-foreground">
                  Compares categories or regions side by side. In EcoEquity, we use bar charts to
                  show <strong>top donors, sectors, or hotspot countries</strong> by funding or integration share.
                </p>
              </div>

              <div className="eco-modal-panel p-4 shadow-sm">
                <h4 className="font-semibold text-foreground mb-1">📈 Line Graph</h4>
                <p className="text-sm text-muted-foreground">
                  Tracks change over time. Used to display trends such as the
                  <strong> rise of integrated projects</strong> or
                  <strong> average project size per year</strong>.
                </p>
              </div>

              <div className="eco-modal-panel p-4 shadow-sm">
                <h4 className="font-semibold text-foreground mb-1">🗺️ Matrix / Heatmap</h4>
                <p className="text-sm text-muted-foreground">
                  Uses color intensity to show concentration — darker shades mean more funding or stronger
                  integration. We use it for the <strong>Donor × Region Overlap</strong> view.
                </p>
              </div>

              <div className="eco-modal-panel p-4 shadow-sm">
                <h4 className="font-semibold text-foreground mb-1">🧩 Composite / Mixed Graph</h4>
                <p className="text-sm text-muted-foreground">
                  Combines bars and lines to show <strong>volume and funding trends together</strong>.
                  For example, bars for project counts and a line for total disbursements.
                </p>
              </div>
            </div>

            {/* Small divider */}
            <div className="pt-4">
              <div className="mx-auto h-px max-w-3xl bg-gradient-to-r from-transparent via-neutral-200/70 dark:via-neutral-800/70 to-transparent" />
            </div>

            {/* Legend / existing accordion help */}
            <p className="pt-4 font-medium text-foreground">Legend used across charts</p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li><strong>Integrated (both):</strong> projects tagged for both gender and climate.</li>
              <li><strong>Gender-only / Climate-only:</strong> projects with only one marker.</li>
              <li><strong>% Integrated:</strong> share within the tagged dataset.</li>
            </ul>

            {/* Keep your Accordion from before here */}
            <Accordion type="single" collapsible className="w-full mt-4">
              <AccordionItem value="heatmap">
                <AccordionTrigger className="text-foreground">Donor × Region Overlap</AccordionTrigger>
                <AccordionContent>
                  <p><strong>What it shows:</strong> Funding by donor & region, plus integration %.</p>
                  <p><strong>How to read:</strong> Darker cells = more money. Bright cells with low % integrated are leverage points.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="trend">
                <AccordionTrigger className="text-foreground">Integration over Time</AccordionTrigger>
                <AccordionContent>
                  <p><strong>What it shows:</strong> Yearly mix of gender-only, climate-only, and integrated projects.</p>
                  <p><strong>How to read:</strong> More teal+purple overlap = progress toward integration.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="hotspots">
                <AccordionTrigger className="text-foreground">Strategic Hotspots</AccordionTrigger>
                <AccordionContent>
                  <p><strong>What it shows:</strong> Countries with high funding but low integration.</p>
                  <p><strong>Use when:</strong> Spotting coordination opportunities.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="fundingVsProjects">
                <AccordionTrigger className="text-foreground">Funding vs Project Volume</AccordionTrigger>
                <AccordionContent>
                  <p><strong>What it shows:</strong> Bars = project counts; line = total USD disbursed.</p>
                  <p><strong>How to read:</strong> Divergence = changing average project size.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}
 


          {/* --- Data Quality, UNDP, and EcoEquity text (keep your originals) --- */}
          {activeHelp === "quality" && (
            <>
              <p className="text-foreground/90">
                Data quality is the foundation of everything EcoEquity builds. Before visualizing or clustering donors,
                we make sure every project record is clean, consistent, and comparable across sources.
              </p>

              {/* 3-Step Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-left">
                {/* Step 1 */}
                <div className="eco-modal-panel p-4 shadow-sm">
                  <h4 className="font-semibold text-foreground mb-1">1️⃣ Data Collection</h4>
                  <p className="text-sm text-muted-foreground">
                    We start with the <strong>OECD CRS dataset</strong> and complementary open datasets (World Bank, UN Comtrade, SDG progress reports)
                    to cover gender and climate markers consistently.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="eco-modal-panel p-4 shadow-sm">
                  <h4 className="font-semibold text-foreground mb-1">2️⃣ Validation & Consistency Checks</h4>
                  <p className="text-sm text-muted-foreground">
                    We run <strong>donor-level reliability tests</strong> — flagging projects where gender or climate markers are missing, inconsistent, or misapplied.
                    NLP helps verify whether the text description aligns with the reported markers.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="eco-modal-panel p-4 shadow-sm">
                  <h4 className="font-semibold text-foreground mb-1">3️⃣ Repair & Imputation</h4>
                  <p className="text-sm text-muted-foreground">
                    For incomplete records, we use <strong>rule-based and statistical imputation</strong> to fill gaps. The result: 
                    a cleaner, more reliable dataset ready for integration analysis and visualization.
                  </p>
                </div>
              </div>

              {/* Why it matters */}
              <div className="pt-4 text-left space-y-2">
                <h4 className="font-medium text-foreground">Why this matters</h4>
                <p className="text-sm text-muted-foreground">
                  Many global aid datasets are self-reported and prone to inconsistency. By rebuilding a validated layer of
                  gender–climate data, EcoEquity ensures that UNDP insights and coordination decisions are grounded in facts,
                  not reporting gaps.
                </p>
                <p className="text-sm text-muted-foreground">
                  Reliable data → trustworthy insights → better donor collaboration.
                </p>
              </div>
            </>
          )}

          {activeHelp === "undp" && (
            <>
              <p className="text-foreground/90">
                This glossary describes the main <strong>CRS/UNDP data fields</strong> that power the dashboards.
                It’s here so users know exactly what each column means and how we use it.
              </p>

              {/* Scope note */}
              <div className="eco-modal-panel p-3 mt-3 text-left">
                <p className="text-sm text-muted-foreground">
                  <strong>Scope:</strong> EcoEquity focuses on the slice of projects with <em>gender and/or climate</em> policy markers.
                  Untagged projects are outside this view.
                </p>
              </div>

              {/* Field groups */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-left">
                {/* Identifiers */}
                <div className="eco-modal-panel p-4 shadow-sm">
                  <h4 className="font-semibold mb-1">Core Identifiers</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li><strong>CRS/Activity ID:</strong> unique project/activity identifier.</li>
                    <li><strong>Year:</strong> reporting year of the record.</li>
                    <li><strong>Title:</strong> short project title; used in tooltips and search.</li>
                    <li><strong>Description (short/long):</strong> text used by NLP to validate integration signals.</li>
                  </ul>
                </div>

                {/* Actors & geography */}
                <div className="eco-modal-panel p-4 shadow-sm">
                  <h4 className="font-semibold mb-1">Actors & Geography</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li><strong>Donor / Reporting Org:</strong> funding organization (used in donor profiles & clusters).</li>
                    <li><strong>Recipient Country/Region:</strong> where funding is targeted; feeds maps and regional splits.</li>
                    <li><strong>Channel:</strong> delivery channel (e.g., multilateral, NGO, public sector).</li>
                  </ul>
                </div>

                {/* Finance */}
                <div className="eco-modal-panel p-4 shadow-sm">
                  <h4 className="font-semibold mb-1">Finance</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li><strong>Commitment (USD):</strong> pledged amount for the activity/year.</li>
                    <li><strong>Disbursement (USD):</strong> money actually disbursed; used in most totals.</li>
                    <li><strong>Projects (count):</strong> number of tagged activities; powers “# Projects” charts.</li>
                    <li><strong>Flow / Finance / Aid Type:</strong> DAC coding for modality and instrument (e.g., grant, loan).</li>
                  </ul>
                </div>

                {/* Classification */}
                <div className="eco-modal-panel p-4 shadow-sm">
                  <h4 className="font-semibold mb-1">Classification</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li><strong>Sector / DAC Purpose Code:</strong> thematic focus; drives sector dashboards.</li>
                    <li><strong>Gender Marker (0/1/2):</strong> policy-marker for gender equality.</li>
                    <li><strong>Climate (Rio) Marker (0/1/2):</strong> mitigation/adaptation markers; either counts.</li>
                    <li><strong>Integrated flag:</strong> derived field we compute where <em>Gender ≥ 1</em> and <em>Climate ≥ 1</em>.</li>
                  </ul>
                </div>
              </div>

              {/* Caveats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-left">
                <div className="eco-modal-panel p-4 shadow-sm">
                  <h4 className="font-semibold">Caveats</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Markers are <strong>self-reported</strong> and may be inconsistent across donors.</li>
                    <li>Missing fields occur; we document and limit <strong>imputation</strong> to preserve comparability.</li>
                    <li>Sector coding can differ between organizations; treat sector splits as directional.</li>
                  </ul>
                </div>

                <div className="eco-modal-panel p-4 shadow-sm">
                  <h4 className="font-semibold">What EcoEquity adds</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li><strong>NLP validation</strong> on descriptions to check if markers match activity text.</li>
                    <li><strong>Integration Score</strong> & donor <strong>archetypes</strong> built on top of these fields.</li>
                    <li>Clean, comparable aggregates for dashboards & coordination briefs.</li>
                  </ul>

                  {/* Quick jump to EcoEquity Markers */}
                  <div className="pt-3">
                    <Button size="sm" variant="secondary" onClick={() => setActiveHelp("ecoequity")}>
                      See EcoEquity Markers
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeHelp === "ecoequity" && (
            <>
              <p className="text-foreground/90">
                EcoEquity Markers summarize how a donor approaches the gender × climate space. We compute an
                <strong> Integration Score</strong> from CRS markers + NLP on descriptions, then classify donors into simple
                behavioral archetypes.
              </p>

              {/* Integration Score explainer */}
              <div className="eco-modal-panel p-4 shadow-sm mt-3 text-left">
              <h4 className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> What is the Integration Score?
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/70 font-semibold mb-1">Signals</p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      <li><strong>Markers:</strong> Gender & Climate policy markers (0/1/2).</li>
                      <li><strong>NLP text:</strong> phrases indicating gender outcomes inside climate work (and vice-versa).</li>
                      <li><strong>Reliability:</strong> donor-level consistency checks down-weight noisy coding.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/70 font-semibold mb-1">How it’s combined</p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      <li>Weighted blend: <em>markers (base) + text (lift) – penalties (inconsistency)</em>.</li>
                      <li>Normalized to a <strong>0–100</strong> scale per year range.</li>
                      <li>Only the gender/climate-tagged slice is scored.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/70 font-semibold mb-1">Thresholds (hints)</p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      <li><strong>High:</strong> ≥ 70 — integration is routine.</li>
                      <li><strong>Mid:</strong> 40–69 — integration present, not dominant.</li>
                      <li><strong>Low:</strong> &lt; 40 — mostly single-marker portfolios.</li>
                    </ul>
                  </div>
                </div>
                <p className="text-xs mt-2 text-muted-foreground">
                  Exact weights/thresholds are configurable in the repository   ; dashboards display the current tuned setup.
                </p>
              </div>

              {/* Archetypes */}
              <div className="pt-4 text-left">
                <h4 className="font-semibold mb-2">Archetypes (EcoEquity Markers)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Natural Integrators */}
                  <div className="eco-modal-panel p-4 shadow-sm">
                    <Badge variant="secondary" className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-300">Natural Integrators</Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      Routinely fund gender and climate <em>together</em>. Integrated share is high and stable.
                    </p>
                    <p className="text-xs mt-2 text-muted-foreground">Heuristic: Score high; integrated % ≥ global baseline and largest slice.</p>
                  </div>

                  {/* Gender Specialists */}
                  <div className="eco-modal-panel p-4 shadow-sm">
                    <Badge variant="secondary" className="bg-fuchsia-600/10 text-fuchsia-700 dark:text-fuchsia-300">Gender Specialists</Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      Strong gender portfolio; climate lighter. Integration exists but gender-only dominates.
                    </p>
                    <p className="text-xs mt-2 text-muted-foreground">Heuristic: gender-only % ≫ climate-only %; score mid.</p>
                  </div>

                  {/* Climate Specialists */}
                  <div className="eco-modal-panel p-4 shadow-sm">
                    <Badge variant="secondary" className="bg-teal-600/10 text-teal-700 dark:text-teal-300">Climate Specialists</Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      Climate-heavy portfolios with less explicit gender integration.
                    </p>
                    <p className="text-xs mt-2 text-muted-foreground">Heuristic: climate-only % ≫ gender-only %; score mid.</p>
                  </div>

                  {/* Sequential Builders */}
                  <div className="eco-modal-panel p-4 shadow-sm">
                    <Badge variant="secondary" className="bg-sky-600/10 text-sky-700 dark:text-sky-300">Sequential Builders</Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      Do one focus first, then add the other; integration is <em>growing</em> but not dominant.
                    </p>
                    <p className="text-xs mt-2 text-muted-foreground">Signal: integrated % moderate with upward trend; both single-marker slices present.</p>
                  </div>
                </div>
              </div>

              {/* Mini example */}
              <div className="eco-modal-panel mt-4 text-left">
                <h4 className="font-semibold mb-1">Example (how a project lifts the score)</h4>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Project has <strong>Gender = 1</strong> and <strong>Climate = 2</strong> → good base signal.</li>
                  <li>Description mentions <em>women’s livelihoods</em> inside a <em>climate adaptation</em> program → NLP boost.</li>
                  <li>Donor historically applies markers consistently → small reliability bonus.</li>
                </ul>
                <p className="text-xs mt-2 text-muted-foreground">The aggregate of many such projects shapes the donor’s Integration Score & archetype.</p>
              </div>

              {/* Footer actions */}
              <div className="pt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Use archetypes to tailor engagement with development stakeholders: for climate-heavy donors, present climate action as <em>gender resilience</em>; for gender-heavy donors, emphasize climate co-benefits.
                </p>
                <Button asChild size="sm" variant="secondary">
                  <a href="https://github.com/hayat711/UNDP_Dashboard" target="_blank" rel="noopener noreferrer">View scoring config</a>
                </Button>
              </div>
            </>
          )}


        </div>
      </DialogContent>
    </Dialog>


      {/* --- ABOUT THE TEAM --- */}
      <section className="w-full py-20 md:py-15 bg-gradient-to-b from-emerald-50/30 via-cyan 50/20 to-transparent dark:from-emerald-800/20 dark:via-cyan-100/10 dark:to-transparent border-t border-neutral-200/60 dark:border-neutral-600/60">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">About the Team</h2>
            <p className="text-muted-foreground text-lg max-w-5xl mx-auto">
              The EcoEquity project is led by a multidisciplinary team from the
              Department of Data Science of Seoul National University of Science
              and Technology. The team is passionate about sustainable data
              intelligence, gender equity, and climate innovation.
            </p>
          </div>

          {/* Team grid */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* --- TEAM MEMBER CARD --- */}
            {[
              {
                name: "Hayatullah Hassanpour",
                role: "Software Developer",
                image: "/images/hayat.jpg",
                website: "https://hayatt.vercel.app/",
                linkedin: "https://linkedin.com/in/hayyat",
                github: "https://github.com/hayat711"
              },
              {
                name: "Juliet Ondisi",
                role: "Data Scientist",
                image: "/images/juliet.png",
                website: "https://github.com/Julie-Montague",
                linkedin: "https://www.linkedin.com/in/julietondisi",
              },
              {
                name: "Jostin Jerico Rosal",
                role: "Business Analyst Project Manager",
                image: "/images/jostin.jpg",
                website: "www.jostinjerico.com",
                linkedin: "https://www.linkedin.com/in/jostinjerico/",
              },
            ].map((member, i) => (
              <div
                key={i}
                className="eco-modal-panel group flex items-center gap-4 p-6 rounded-2xl bg-muted/90 backdrop-blur-sm border border-neutral-200/60 dark:border-neutral-800/60 hover:shadow-lg transition-all-smooth"
              >
                {/* PHOTO */}
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-primary-300 flex-shrink-0">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="object-cover w-full h-full"
                  />
                </div>

                {/* DETAILS */}
                <div className="text-left space-y-1">
                  <h3 className="text-lg font-semibold">{member.name}</h3>
                  <p className="text-sm text-primary">{member.role}</p>
                  <div className="flex gap-3 pt-2">
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        className="w-5 h-5"
                      >
                        <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.77 0 5-2.24 5-5v-14c0-2.76-2.23-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.44c-.96 0-1.75-.79-1.75-1.76s.79-1.75 1.75-1.75 1.75.78 1.75 1.75-.79 1.76-1.75 1.76zm13.5 11.44h-3v-5.5c0-1.31-.03-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9v5.6h-3v-10h2.88v1.36h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.61v5.59z" />
                      </svg>
                    </a>
                    <a
                      href={member.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}