import { Suspense } from "react";
import { getCountryOpportunities, getRecipientInsights } from "./actions";
import RecipientsClient from "../../../components/RecipientClient";
import { Card } from "@/components/ui/card";
import {
  Info,
  AlertTriangle,
  Globe,
  Zap,
  Landmark,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function RecipientsPage() {
  const [countryData, recipientInsights] = await Promise.all([
    getCountryOpportunities(),
    getRecipientInsights(),
  ]);

  return (
    <div className="container mx-auto px-4 md:px-8 lg:px-16 py-4 space-y-2">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          Recipient Countries Analysis
        </h1>
        <p className="text-sm text-muted-foreground max-w-5xl">
          Explore funding patterns across recipient countries, identify gaps,
          and understand how ODA contributes to national priorities
        </p>
      </div>

      <Suspense
        fallback={<div className="text-center py-12">Loading data...</div>}
      >
        {/* Hero Header — "How to Read This Page" */}
        <Card className="p-5 border-l-4 border-l-orange-500 bg-orange-50/30 dark:bg-background">
          <div className="flex gap-3">
            <div className="mt-0.5">
              <Info className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Recipient Countries Analysis
              </h2>
              <p className="text-muted-foreground mb-3">
                Which countries receive the most gender- and climate-tagged ODA,
                how integrated that funding is, and where coverage gaps exist.
              </p>
              <p className="text-sm text-muted-foreground italic">
                <span className="font-semibold">Why this matters:</span> A
                country with high funding but low integration % is a leverage
                point as knowing the top recipients helps target policy
                dialogue.
              </p>
              <div className="mt-3 p-3 bg-background rounded border text-xs">
                <span className="font-semibold">Important scope note:</span>{" "}
                This dashboard only includes projects that carry a gender
                marker, a climate marker, or both. Projects with no
                gender/climate marker are excluded. You're seeing the gender-
                and climate-relevant slice of finance — not the entire aid
                portfolio.
              </div>
            </div>
          </div>
        </Card>

        {/* Recipient Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
         
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Landmark className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Top Recipient
                </div>
                <div className="text-lg font-bold text-foreground">
                  {recipientInsights.topRecipient}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(recipientInsights.topRecipientFunding)}
                </div>
              </div>
            </div>
          </Card>

          {/* Most Integrated */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Zap className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Most Integrated
                </div>
                <div className="text-lg font-bold text-foreground">
                  {recipientInsights.mostIntegratedCountry}
                </div>
                <div className="text-sm text-emerald-600 font-medium mt-1">
                  {recipientInsights.mostIntegratedPct.toFixed(1)}% integrated
                </div>
              </div>
            </div>
          </Card>

          {/* Largest Gap */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Largest Gap
                </div>
                <div className="text-lg font-bold text-foreground">
                  {recipientInsights.largestGapCountry}
                </div>
                <div className="text-sm text-red-600 font-medium mt-1">
                  Only {recipientInsights.largestGapPct.toFixed(1)}% integrated
                </div>
              </div>
            </div>
          </Card>

          {/* Geographic Reach */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Globe className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Countries Reached
                </div>
                <div className="text-lg font-bold text-foreground">
                  {recipientInsights.countryCount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  With ≥1 tagged project
                </div>
              </div>
            </div>
          </Card> 
         </div>

        <RecipientsClient initialData={countryData} />
      </Suspense>
    </div>
  );
}