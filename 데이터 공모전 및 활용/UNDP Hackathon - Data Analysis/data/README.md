# Data Directory

This directory contains all datasets used in the UNDP Development Data Integration project for analyzing gender-climate development synergies through Official Development Assistance (ODA) data.

## Directory Structure

```
/data/
├── raw/                    # Original, unprocessed datasets
│   ├── ccvi/              # Climate Change Vulnerability Index data
│   ├── crs/               # OECD Creditor Reporting System data
│   ├── nd_gain/           # ND-GAIN climate vulnerability data
│   ├── undp_hdr/          # UNDP Human Development Reports data
│   └── aid_data/          # Additional aid-related datasets
├── processed/             # Cleaned and transformed datasets
│   ├── ccvi/              # Processed CCVI data
│   ├── crs/               # Aggregated CRS data by country-year
│   ├── nd_gain/           # Processed ND-GAIN indicators
│   ├── undp_hdr/          # Processed HDR indicators
│   └── aid_data/          # Processed aid datasets
└── final_composed/        # Integrated datasets ready for analysis
    └── final_composed_data.csv  # Main analysis dataset
```

## Dataset Overview

### Time Period
**2014-2023** (10 years)

### Geographic Coverage
**145 recipient countries** with valid ISO3 codes

### Primary Data Sources

| Dataset | Provider | Key Variables | Format |
|---------|----------|---------------|---------|
| **CRS** | OECD | Financial flows, sector codes, gender/climate markers | CSV/Parquet |
| **CCVI** | Climate—Conflict—Vulnerability Index | Climate/Conflict vulnerability scores, risk indicators | CSV |
| **HDR** | UNDP | Human development indices (HDI, GII, GDI) | CSV |
| **ND-GAIN** | Notre Dame | Vulnerability and readiness scores | CSV |

## Key Features in Final Dataset

### Financial Metrics
- `USD_Commitment_sum`: Total committed aid (USD)
- `USD_Disbursement_mean`: Average disbursement amounts
- `ProjectCount`: Number of development projects

### Gender Indicators
- `gender_focused_perc`: Percentage of gender-targeted projects
- `gender_focused_amount`: Dollar amount for gender-focused aid
- `GII`: Gender Inequality Index

### Climate/Environment
- `climate_adaptation_perc`: Climate adaptation project percentage
- `CCVI`: Climate Change Vulnerability Index
- `Vulnerability`: ND-GAIN vulnerability score

### Derived Features
- `Gender_Climate_Synergy`: Combined gender-climate effectiveness metric
- `composite_vulnerability`: Weighted vulnerability composite
- `Commitment_Efficiency`: Disbursement-to-commitment ratio

## Data Quality

### Completeness
- **1,450 country-year observations** (145 countries × 10 years)
- Missing values handled through interpolation or regional medians
- Primary key: `iso3 + Year`

### File Formats
- **Raw data**: Original formats (CSV, Excel)
- **Processed data**: Optimized CSV/Parquet with appropriate data types
- **Final dataset**: Compressed Parquet format (47 columns)

## Usage Notes

1. **Primary analysis dataset**: Use `final_composed/unified_dataset.parquet`
2. **Data types**: Financial variables as float32, counts as integers
3. **Missing values**: Climate markers treated as 0 (non-climate projects)
4. **Currency**: All financial data in constant 2023 USD

## Data Integration Methodology

The final dataset represents a left-join integration maintaining all country-year combinations from the CRS database, with complementary datasets merged via ISO3 country codes and year. Detailed methodology available in the main project README.

---

