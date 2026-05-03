import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export async function GET() {
  try {
    const procDir = path.join(process.cwd(), 'public', 'data', 'processed');

    // Helper to read and parse CSV
    const readCsv = (filename: string) => {
      const content = fs.readFileSync(path.join(procDir, filename), 'utf-8');
      const parsed = Papa.parse(content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });
      if (parsed.errors.length > 0) {
        console.warn(`CSV parse errors in ${filename}:`, parsed.errors);
      }
      return parsed.data;
    };

    // Helper to read JSON
    const readJson = (filename: string) => {
      const content = fs.readFileSync(path.join(procDir, filename), 'utf-8');
      return JSON.parse(content);
    };

    // Load ALL precomputed data (for all dashboard tabs)
    const aggregatedFunding = readCsv('aggregated_funding.csv');
    const donorBucketShares = readCsv('donor_bucket_shares.csv');
    const sectorBucketShares = readCsv('sector_bucket_shares.csv');
    const recipientBucketShares = readCsv('recipient_bucket_shares.csv');
    const dataQualityMetrics = readJson('data_quality_metrics.json');
    const granularityReport = readJson('granularity_report.json');
    
    // New files for advanced tabs
    const donorProfiles = readCsv('donor_profiles.csv');
    const sectorAnalysis = readCsv('sector_analysis.csv');
    const countryOpportunities = readCsv('country_opportunities.csv');
    
    // Optional: Add text validation results if generated
    let textValidationResults = null;
    try {
      textValidationResults = readJson('text_validation_results.json');
    } catch (e) {
      console.warn('Text validation results not found, skipping...');
    }

    return NextResponse.json({
      success: true,
      metadata: {
        fundingUnit: "million_usd", // or "billion_usd" if you divide by 1000
        currency: "USD",
        years: [2014, 2023],
      },
      processedData: {
        // Overview tab
        aggregatedFunding,
        dataQualityMetrics,
        granularityReport,
        
        // Donors tab
        donorProfiles,
        donorBucketShares,
        
        // Trends tab
        sectorAnalysis,
        sectorBucketShares,
        
        // Quality tab
        textValidationResults,
        
        // Data Insights tab
        countryOpportunities,
        recipientBucketShares,
      },
    });
  } catch (error) {
    console.error('Error loading processed data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load processed data' },
      { status: 500 }
    );
  }
}