'use server';

import { query } from '@/lib/db/client';

export async function getCountryOpportunities() {
  const result = await query(`
    SELECT 
    recipient_name as "countryName",
    SUM(usd_disbursement) as "totalFunding",
    SUM(CASE WHEN bucket = 'Gender Only' THEN usd_disbursement ELSE 0 END) as "genderFunding",
    SUM(CASE WHEN bucket = 'Climate Only' THEN usd_disbursement ELSE 0 END) as "climateFunding",
    SUM(CASE WHEN bucket = 'Integrated' THEN usd_disbursement ELSE 0 END) as "integratedFunding",
    SUM(CASE WHEN bucket = 'Gender Only' THEN 1 ELSE 0 END) as "genderProjects",
    SUM(CASE WHEN bucket = 'Climate Only' THEN 1 ELSE 0 END) as "climateProjects",
    SUM(CASE WHEN bucket = 'Integrated' THEN 1 ELSE 0 END) as "integratedProjects"
  FROM projects 
    WHERE bucket IN ('Gender Only', 'Climate Only', 'Integrated')
      AND recipient_name IS NOT NULL
      AND recipient_name != ''
    GROUP BY recipient_name
    HAVING 
      COUNT(*) >= 5
      AND SUM(usd_disbursement) > 0
    ORDER BY "totalFunding" DESC
    LIMIT 100
  `);

  return result.rows;
}

export async function getCountryDonorBreakdown(countryName: string) {
  const result = await query(`
    SELECT 
      donor_name as "donorName",
      bucket,
      SUM(usd_disbursement) as funding,
      COUNT(*) as "projectCount"
    FROM projects
    WHERE recipient_name = $1
      AND bucket IN ('Gender Only', 'Climate Only', 'Integrated')
    GROUP BY donor_name, bucket
    ORDER BY funding DESC
    LIMIT 20
  `, [countryName]);

  return result.rows;
}

export async function getCountrySectorBreakdown(countryName: string) {
  const result = await query(`
    SELECT 
      sector_name as "sectorName",
      bucket,
      SUM(usd_disbursement) as funding,
      COUNT(*) as "projectCount"
    FROM projects
    WHERE recipient_name = $1
      AND bucket IN ('Gender Only', 'Climate Only', 'Integrated')
      AND sector_name IS NOT NULL
    GROUP BY sector_name, bucket
    ORDER BY funding DESC
    LIMIT 10
  `, [countryName]);

  return result.rows;
}

export async function getCountryTimeSeries(countryName: string) {
  const result = await query(`
    SELECT 
      year,
      bucket,
      SUM(usd_disbursement) as funding,
      COUNT(*) as "projectCount"
    FROM projects
    WHERE recipient_name = $1
      AND bucket IN ('Gender Only', 'Climate Only', 'Integrated')
      AND year >= 2014
      AND year <= 2023
    GROUP BY year, bucket
    ORDER BY year ASC
  `, [countryName]);

  return result.rows;
}

export async function getCountryMetrics(countryName: string) {
  const result = await query(`
    SELECT 
      COUNT(DISTINCT donor_name) as "activeDonors",
      COUNT(DISTINCT sector_name) as sectors,
      COUNT(*) as projects,
      ROUND(
        (SUM(CASE WHEN bucket = 'Integrated' THEN 1 ELSE 0 END)::NUMERIC / 
         NULLIF(COUNT(*), 0) * 100), 1
      ) as "integrationRate"
    FROM projects
    WHERE recipient_name = $1
      AND bucket IN ('Gender Only', 'Climate Only', 'Integrated')
  `, [countryName]);

  return result.rows[0] || {
    activeDonors: 0,
    sectors: 0,
    projects: 0,
    integrationRate: 0
  };
}

export async function getTopDonorsByType(countryName: string) {
  // Removed donor_type completely — grouping only by bucket and donor_name
  const result = await query(`
    WITH donor_totals AS (
      SELECT 
        donor_name,
        bucket,
        SUM(usd_disbursement) as total_funding,
        COUNT(*) as project_count,
        ROW_NUMBER() OVER (PARTITION BY bucket ORDER BY SUM(usd_disbursement) DESC) as rn
      FROM projects
      WHERE recipient_name = $1
        AND bucket IN ('Gender Only', 'Climate Only', 'Integrated')
      GROUP BY donor_name, bucket
    )
    SELECT 
      donor_name as "donorName",
      bucket,
      total_funding as funding,
      project_count as "projectCount"
    FROM donor_totals
    WHERE rn <= 5
    ORDER BY bucket, funding DESC
  `, [countryName]);

  return result.rows;
}

export async function getFundingGaps() {
  const result = await query(`
    WITH country_themes AS (
      SELECT 
        recipient_name,
        SUM(usd_disbursement) as total_funding,
        SUM(CASE WHEN bucket = 'Gender Only' THEN 1 ELSE 0 END) as has_gender,
        SUM(CASE WHEN bucket = 'Climate Only' THEN 1 ELSE 0 END) as has_climate,
        SUM(CASE WHEN bucket = 'Integrated' THEN 1 ELSE 0 END) as has_integrated
      FROM projects
      WHERE bucket IN ('Gender Only', 'Climate Only', 'Integrated')
        AND recipient_name IS NOT NULL
      GROUP BY recipient_name
      HAVING SUM(usd_disbursement) > 1000000
    )
    SELECT 
      recipient_name as "countryName",
      total_funding as "totalFunding",
      CASE WHEN has_gender = 0 THEN 1 ELSE 0 END as "genderGap",
      CASE WHEN has_climate = 0 THEN 1 ELSE 0 END as "climateGap",
      CASE WHEN has_integrated = 0 THEN 1 ELSE 0 END as "integrationGap",
      (CASE WHEN has_gender = 0 THEN 1 ELSE 0 END + 
       CASE WHEN has_climate = 0 THEN 1 ELSE 0 END + 
       CASE WHEN has_integrated = 0 THEN 1 ELSE 0 END) as "totalGaps"
    FROM country_themes
    WHERE (has_gender = 0 OR has_climate = 0 OR has_integrated = 0)
    ORDER BY total_funding DESC
    LIMIT 50
  `);

  return result.rows;
}


export async function getRecipientInsights() {
  const result = await query(`
    WITH country_metrics AS (
      SELECT 
        recipient_name as "countryName",
        SUM(usd_disbursement) as total_funding,
        SUM(CASE WHEN bucket = 'Integrated' THEN usd_disbursement ELSE 0 END) as integrated_funding,
        SUM(CASE WHEN bucket = 'Gender Only' THEN usd_disbursement ELSE 0 END) as gender_only_funding,
        SUM(CASE WHEN bucket = 'Climate Only' THEN usd_disbursement ELSE 0 END) as climate_only_funding,
        COUNT(*) as project_count
      FROM projects
      WHERE bucket IN ('Gender Only', 'Climate Only', 'Integrated')
        AND recipient_name IS NOT NULL
        AND recipient_name != ''
      GROUP BY recipient_name
      HAVING 
        COUNT(*) >= 5 
        AND SUM(usd_disbursement) > 0
    ),
    integration_scores AS (
      SELECT 
        *,
        CASE 
          WHEN total_funding > 0 
          THEN (integrated_funding / total_funding) * 100 
          ELSE 0 
        END as integration_pct,
        -- True gap: has BOTH gender-only AND climate-only funding
        (gender_only_funding > 0 AND climate_only_funding > 0) as has_both_themes
      FROM country_metrics
    )
    SELECT
      -- Top Recipient (any tagged funding)
      (SELECT "countryName" FROM integration_scores ORDER BY total_funding DESC LIMIT 1) as "topRecipient",
      (SELECT total_funding FROM integration_scores ORDER BY total_funding DESC LIMIT 1) as "topRecipientFunding",

      -- Most Integrated (min $10M funding)
      (SELECT "countryName" 
       FROM integration_scores 
       WHERE total_funding >= 10 
       ORDER BY integration_pct DESC, total_funding DESC 
       LIMIT 1) as "mostIntegratedCountry",
      (SELECT integration_pct 
       FROM integration_scores 
       WHERE total_funding >= 10 
       ORDER BY integration_pct DESC, total_funding DESC 
       LIMIT 1) as "mostIntegratedPct",

      -- Largest Gap: Must have BOTH themes, min $50M, lowest integration
      (SELECT "countryName" 
       FROM integration_scores 
       WHERE total_funding >= 50 
         AND has_both_themes = true
         AND integration_pct < 100  -- exclude 100% integrated
       ORDER BY integration_pct ASC, total_funding DESC 
       LIMIT 1) as "largestGapCountry",
      (SELECT integration_pct 
       FROM integration_scores 
       WHERE total_funding >= 50 
         AND has_both_themes = true
         AND integration_pct < 100
       ORDER BY integration_pct ASC, total_funding DESC 
       LIMIT 1) as "largestGapPct",

      -- Geographic Reach (all countries with tagged projects)
      (SELECT COUNT(*) FROM integration_scores) as "countryCount"
  `);

  const row = result.rows[0];
  return {
    topRecipient: row.topRecipient || "—",
    topRecipientFunding: parseFloat(row.topRecipientFunding) || 0,
    mostIntegratedCountry: row.mostIntegratedCountry || "—",
    mostIntegratedPct: parseFloat(row.mostIntegratedPct) || 0,
    largestGapCountry: row.largestGapCountry || "—",
    largestGapPct: parseFloat(row.largestGapPct) || 0,
    countryCount: parseInt(row.countryCount) || 0,
  };
}