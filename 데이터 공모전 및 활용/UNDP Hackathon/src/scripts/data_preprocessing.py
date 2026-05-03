"""
EcoEquity Data Preprocessing Script (Production-Ready)
Processes large CRS dataset and outputs lightweight, validated aggregated CSVs
Aligned with EDA notebook: collapses to project-year-donor level
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path
import re

# Configuration
INPUT_FILE = 'public/data/crs_data_final.csv'
OUTPUT_DIR = 'public/data/processed'

def clean_funding_column(series: pd.Series) -> pd.Series:
    """
    Robustly clean funding columns:
    - Convert "n.a.", "unspecified", empty to NaN
    - Remove commas, $, parentheses (for negatives)
    - Coerce to numeric
    """
    s = series.astype(str).str.strip().str.lower()
    s = s.replace({
        r'n\.?a\.?': np.nan,
        r'unspecified': np.nan,
        r'': np.nan,
        r'nan': np.nan
    }, regex=True)
    s = s.str.replace(r'[\$,]', '', regex=True)
    neg_mask = s.str.contains(r'^\(.*\)$', na=False)
    s = s.str.replace(r'[()]', '', regex=True)
    s = pd.to_numeric(s, errors='coerce')
    s = s.where(~neg_mask, -s.abs())
    return s

def categorize_bucket(row):
    """Categorize project into integration bucket (binary logic: ≥1 = present)"""
    has_gender = row['Gender'] >= 1
    has_climate = (row['ClimateMitigation'] >= 1) or (row['ClimateAdaptation'] >= 1)
    
    if has_gender and has_climate:
        return 'Integrated'
    elif has_gender:
        return 'Gender Only'
    elif has_climate:
        return 'Climate Only'
    else:
        return 'Neither'

def process_data():
    print("Loading and cleaning data...")
    
    # Read CSV
    df = pd.read_csv(INPUT_FILE, low_memory=False)
    print(f"Loaded {len(df):,} records")
    
    # --- DATA CLEANING ---
    print("Cleaning funding columns...")
    df['USD_Disbursement'] = clean_funding_column(df['USD_Disbursement'])
    df['USD_Commitment_imputed'] = clean_funding_column(df['USD_Commitment_imputed'])
    
    # Filter out invalid projects
    print("Filtering out pooled/unspecified projects...")
    df = df.copy()
    df['ProjectNumber'] = df['ProjectNumber'].astype(str).str.strip()
    df = df[~df['ProjectNumber'].str.lower().isin(['n.a.', 'n/a', 'unspecified', 'pooled', ''])]
    
    # Ensure key columns are valid
    df = df.dropna(subset=['Year', 'DonorName', 'RecipientName', 'SectorName'])
    df['Year'] = pd.to_numeric(df['Year'], errors='coerce').astype('Int64')
    df = df[df['Year'].between(2014, 2023)]
    
    # Clean markers
    for col in ['Gender', 'ClimateMitigation', 'ClimateAdaptation']:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype('Int8')
        df[col] = df[col].clip(lower=0)
    
    print(f"Cleaned to {len(df):,} valid records")
    
    # --- CRITICAL: COLLAPSE TO PROJECT-YEAR-DONOR LEVEL ---
    print("Collapsing to project-year-donor level...")
    df_collapsed = df.groupby(['ProjectNumber', 'Year', 'DonorName'], observed=True).agg({
        'Gender': 'mean',
        'ClimateMitigation': 'mean',
        'ClimateAdaptation': 'mean',
        'USD_Disbursement': 'sum',
        'USD_Commitment_imputed': 'sum',
        'RecipientName': 'first',
        'SectorName': 'first',
        'RegionName': 'first'
    }).reset_index()
    
    # Recompute funding
    df_collapsed['Funding'] = df_collapsed['USD_Disbursement'].fillna(df_collapsed['USD_Commitment_imputed']).fillna(0)
    
    # Categorize bucket
    df_collapsed['Bucket'] = df_collapsed.apply(categorize_bucket, axis=1)
    
    print(f"Collapsed to {len(df_collapsed):,} project-year-donor records")
    
    # Create output directory
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    
    # --- AGGREGATED FUNDING BY YEAR AND BUCKET ---
    print("Aggregating by year and bucket...")
    yearly_agg = df_collapsed.groupby(['Year', 'Bucket'], observed=True).agg({
        'Funding': 'sum',
        'ProjectNumber': 'count'
    }).reset_index()
    yearly_agg.columns = ['year', 'bucket', 'totalFunding', 'projectCount']
    yearly_agg['avgFunding'] = np.where(
        yearly_agg['projectCount'] > 0,
        yearly_agg['totalFunding'] / yearly_agg['projectCount'],
        0
    )
    yearly_agg = yearly_agg.sort_values(['year', 'bucket'])
    yearly_agg.to_csv(f'{OUTPUT_DIR}/aggregated_funding.csv', index=False)
    print(f" Saved aggregated_funding.csv ({len(yearly_agg)} rows)")
    
    # --- DONOR BUCKET SHARES ---
    print("👥 Calculating donor bucket shares...")
    donor_agg = df_collapsed.groupby(['DonorName', 'Bucket'], observed=True).agg({
        'Funding': 'sum',
        'ProjectNumber': 'count'
    }).reset_index()
    
    donor_pivot = donor_agg.pivot(index='DonorName', columns='Bucket', values='ProjectNumber').fillna(0)
    donor_funding_pivot = donor_agg.pivot(index='DonorName', columns='Bucket', values='Funding').fillna(0)
    
    for bucket in ['Integrated', 'Gender Only', 'Climate Only', 'Neither']:
        if bucket not in donor_pivot.columns:
            donor_pivot[bucket] = 0
        if bucket not in donor_funding_pivot.columns:
            donor_funding_pivot[bucket] = 0
    
    donor_stats = pd.DataFrame({
        'donorName': donor_pivot.index,
        'integrated': donor_pivot['Integrated'],
        'genderOnly': donor_pivot['Gender Only'],
        'climateOnly': donor_pivot['Climate Only'],
        'neither': donor_pivot['Neither'],
        'integratedFunding': donor_funding_pivot['Integrated'],
    })
    donor_stats['totalProjects'] = donor_stats[['integrated', 'genderOnly', 'climateOnly', 'neither']].sum(axis=1)
    donor_stats['totalFunding'] = donor_funding_pivot[['Integrated', 'Gender Only', 'Climate Only', 'Neither']].sum(axis=1)
    donor_stats['integratedShare'] = np.where(
        donor_stats['totalProjects'] > 0,
        donor_stats['integrated'] / donor_stats['totalProjects'],
        0
    )
    donor_stats = donor_stats.sort_values('totalFunding', ascending=False)
    donor_stats.to_csv(f'{OUTPUT_DIR}/donor_bucket_shares.csv', index=False)
    print(f"  ✓ Saved donor_bucket_shares.csv ({len(donor_stats)} rows)")
    
    # --- SECTOR & RECIPIENT SHARES ---
    def calculate_shares(group_col, output_name):
        agg = df_collapsed.groupby([group_col, 'Bucket'], observed=True).agg({
            'Funding': 'sum',
            'ProjectNumber': 'count'
        }).reset_index()
        
        pivot = agg.pivot(index=group_col, columns='Bucket', values='ProjectNumber').fillna(0)
        funding_pivot = agg.pivot(index=group_col, columns='Bucket', values='Funding').fillna(0)
        
        for bucket in ['Integrated', 'Gender Only', 'Climate Only', 'Neither']:
            if bucket not in pivot.columns:
                pivot[bucket] = 0
            if bucket not in funding_pivot.columns:
                funding_pivot[bucket] = 0
        
        stats = pd.DataFrame({
            f'{group_col.lower()}Name': pivot.index,
            'integrated': pivot['Integrated'],
            'genderOnly': pivot['Gender Only'],
            'climateOnly': pivot['Climate Only'],
            'neither': pivot['Neither'],
        })
        stats['totalProjects'] = stats[['integrated', 'genderOnly', 'climateOnly', 'neither']].sum(axis=1)
        stats['totalFunding'] = funding_pivot[['Integrated', 'Gender Only', 'Climate Only', 'Neither']].sum(axis=1)
        stats['integratedShare'] = np.where(
            stats['totalProjects'] > 0,
            stats['integrated'] / stats['totalProjects'],
            0
        )
        stats = stats.sort_values('totalFunding', ascending=False)
        stats.to_csv(f'{OUTPUT_DIR}/{output_name}.csv', index=False)
        print(f"  ✓ Saved {output_name}.csv ({len(stats)} rows)")
        return stats
    
    sector_stats = calculate_shares('SectorName', 'sector_bucket_shares')
    recipient_stats = calculate_shares('RecipientName', 'recipient_bucket_shares')
    
    # --- DATA QUALITY METRICS ---
    print("Calculating data quality metrics...")
    total_records = len(df_collapsed)
    quality_metrics = {
        'totalRecords': total_records,
        'genderMarkerCoverage': (df_collapsed['Gender'] >= 1).sum() / total_records,
        'climateMarkerCoverage': ((df_collapsed['ClimateMitigation'] >= 1) | (df_collapsed['ClimateAdaptation'] >= 1)).sum() / total_records,
        'missingDonorName': df_collapsed['DonorName'].isna().sum(),
        'missingRecipientName': df_collapsed['RecipientName'].isna().sum(),
        'missingSectorName': df_collapsed['SectorName'].isna().sum(),
        'zeroFundingProjects': (df_collapsed['Funding'] == 0).sum(),
        'negativeFundingProjects': (df_collapsed['Funding'] < 0).sum(),
    }
    quality_metrics['completenessScore'] = 1 - (
        (quality_metrics['missingDonorName'] + 
         quality_metrics['missingRecipientName'] + 
         quality_metrics['missingSectorName']) / (total_records * 3)
    )
    
    with open(f'{OUTPUT_DIR}/data_quality_metrics.json', 'w') as f:
        json.dump({k: (float(v) if isinstance(v, (np.integer, np.floating)) else v) 
                  for k, v in quality_metrics.items()}, f, indent=2)
    print(f"Saved data_quality_metrics.json")
    
    # --- GRANULARITY REPORT ---
    granularity = {
        'totalProjects': total_records,
        'uniqueDonors': df_collapsed['DonorName'].nunique(),
        'uniqueRecipients': df_collapsed['RecipientName'].nunique(),
        'uniqueSectors': df_collapsed['SectorName'].nunique(),
        'uniqueRegions': df_collapsed['RegionName'].nunique(),
        'yearRange': [int(df_collapsed['Year'].min()), int(df_collapsed['Year'].max())],
        'totalFundingUSD': float(df_collapsed['Funding'].sum()),
    }
    with open(f'{OUTPUT_DIR}/granularity_report.json', 'w') as f:
        json.dump(granularity, f, indent=2)
    print(f"Saved granularity_report.json")
    
    # --- TOP DONORS/RECIPIENTS ---
    top_donors = donor_stats.head(20).to_dict('records')
    with open(f'{OUTPUT_DIR}/top_donors.json', 'w') as f:
        json.dump(top_donors, f, indent=2)
    
    top_recipients = recipient_stats.head(20).to_dict('records')
    with open(f'{OUTPUT_DIR}/top_recipients.json', 'w') as f:
        json.dump(top_recipients, f, indent=2)
    
    # --- DONOR PROFILES WITH ARCHETYPES ---
    print("Calculating donor profiles and archetypes...")
    donor_profiles = donor_stats.copy()
    donor_profiles['projectCount'] = donor_profiles['totalProjects']

    def assign_archetype(row):
        integrated = row['integratedShare']
        gender_only = row['genderOnly'] / row['totalProjects']
        climate_only = row['climateOnly'] / row['totalProjects']
        
        if integrated >= 0.7:
            return "Natural Integrator"
        elif gender_only >= 0.7:
            return "Gender-First Integrator"
        elif climate_only >= 0.7:
            return "Climate Specialist"
        elif integrated >= 0.3:
            return "Sequential Builder"
        else:
            return "Siloed Approach"

    donor_profiles['archetype'] = donor_profiles.apply(assign_archetype, axis=1)
    donor_profiles = donor_profiles.sort_values('totalFunding', ascending=False)
    donor_profiles.to_csv(f'{OUTPUT_DIR}/donor_profiles.csv', index=False)
    print(f"  ✓ Saved donor_profiles.csv ({len(donor_profiles)} rows)")

    # --- SECTOR ANALYSIS ---
    print("Calculating sector analysis...")
    sector_analysis = sector_stats.copy()
    sector_analysis = sector_analysis.sort_values('totalFunding', ascending=False)
    sector_analysis.to_csv(f'{OUTPUT_DIR}/sector_analysis.csv', index=False)
    print(f"  ✓ Saved sector_analysis.csv ({len(sector_analysis)} rows)")

    # --- COUNTRY OPPORTUNITY ANALYSIS ---
    print("Calculating country integration opportunities...")
    country_agg = df_collapsed.groupby(['RecipientName', 'Bucket']).agg({
        'Funding': 'sum',
        'ProjectNumber': 'count'
    }).reset_index()

    country_pivot = country_agg.pivot(index='RecipientName', columns='Bucket', values='ProjectNumber').fillna(0)
    country_funding_pivot = country_agg.pivot(index='RecipientName', columns='Bucket', values='Funding').fillna(0)

    country_opportunities = pd.DataFrame({
        'countryName': country_pivot.index,
        'genderDonors': country_pivot.get('Gender Only', 0),
        'climateDonors': country_pivot.get('Climate Only', 0),
        'integratedDonors': country_pivot.get('Integrated', 0),
        'totalFunding': country_funding_pivot.sum(axis=1).values,
    })
    country_opportunities = country_opportunities.sort_values('totalFunding', ascending=False)
    country_opportunities.to_csv(f'{OUTPUT_DIR}/country_opportunities.csv', index=False)
    print(f"  ✓ Saved country_opportunities.csv ({len(country_opportunities)} rows)")
    
    # --- SUMMARY ---
    print("\n" + "="*60)
    print("PREPROCESSING COMPLETE!")
    print("="*60)
    print(f"Total project-year-donor records: {total_records:,}")
    print(f"Total funding: ${df_collapsed['Funding'].sum():,.2f}")
    print(f"Integrated records: {(df_collapsed['Bucket'] == 'Integrated').sum():,} ({(df_collapsed['Bucket'] == 'Integrated').mean():.1%})")
    print(f"Output directory: {OUTPUT_DIR}")
    
    total_size = sum(f.stat().st_size for f in Path(OUTPUT_DIR).glob('*')) / (1024 * 1024)
    print(f"Total output size: {total_size:.2f} MB")

if __name__ == '__main__':
    process_data()