# Dataset Docs

# UNDP Development Data Integration Report



---

## 1. Executive Summary

This document outlines the methodology for integrating OECD CRS aid data with complementary development indices to create a unified dataset (2014-2023) for analyzing gender-climate development synergies. The final dataset enables time-series and cross-country comparisons across 145 (recipient of aids) countries.

---

## 2. Data Sources and Preparation

### 2.1 Primary Dataset: OECD CRS

| Attribute | Detail |
| --- | --- |
| **Source** | OECD Creditor Reporting System |
| **Time Span** | 2014-2023 |
| **Key Variables** | `USD_Commitment`, `USD_Disbursement`, `Gender_Marker`, `Climate_Adaptation_Marker`, `Sector_Code` |
| **Processing** |  |
- Aggregated to country-year level
- Filtered recipient codes to country-level ISO3 only

### **2.2 Detailed Feature Specification**

### **2.2.1 Financial Metrics**

| **Feature** | **Calculation** | **Type** | **Description** |
| --- | --- | --- | --- |
| **`USD_Commitment_sum`** | **`sum(USD_Commitment)`** | float32 | Total committed aid (USD) |
| **`USD_Disbursement_mean`** | **`mean(USD_Disbursement)`** | float32 | Average disbursement rate |
| **`ProjectCount`** | **`count(ProjectNumber)`** | int32 | Number of projects |
- Had to include the col `sdg with code 13 —> `Take urgent action to combat climate change and its impacts`

**Processing Strategy:**

- Converted to constant 2023 USD using World Bank deflators
- Missing values treated as 0 (no funding)

### **2.2 .2 Gender Indicators**

| **Feature** | **Calculation** | **Formula** | **Purpose** |
| --- | --- | --- | --- |
| **`gender_focused_count`** | **`sum(Gender == 1)`** | **`Σ(gender_marked)`** | Count of gender-targeted projects |
| **`gender_focused_perc`** | **`mean(Gender == 1)`** | **`Σ(gender_marked)/N`** | % of gender-focused aid |
| **`gender_focused_amount`** | **`sum(USD[Gender==1])`** | **`Σ(USD * gender_flag)`** | Dollar amount targeting gender |

**Data Notes:**

- Gender marker: **`1`** = Principal gender objective (OECD DAC codes)
- Validated against UNDP Gender Inequality Index (GII)

### **2.2.3 Climate/Environment Features**

| **Feature** | **Source Field** | **Aggregation** | **Output Type** |
| --- | --- | --- | --- |
| **`climate_adaptation_count`** | ClimateAdaptation | **`sum(x == 1)`** | int32 |
| **`climate_adaptation_perc`** | ClimateAdaptation | **`mean(x == 1)`** | float32 |
| **`Environment_mean`** | Environment | **`mean()`** | float32 |

**Classification Rules:**

- **`ClimateAdaptation == 1`**: Projects with principal climate adaptation objective
- **`Environment == 1`**: Projects with environmental sustainability focus

### **2.2.4 Sectoral Metrics**

| **Feature** | **Calculation** | **Output** | **Description** |
| --- | --- | --- | --- |
| **`primary_sector`** | Mode(SectorName) | string | Most frequent sector per country-year |
| **`sector_diversity`** | nunique(SectorName) | int16 | Number of unique sectors |

**Sector Mapping:**

- Uses OECD DAC 5-digit purpose codes
- Consolidated into 26 sectors using CRS classification

### 2.3 Complementary Datasets

| Dataset | Provider | Key Variables | Merge Logic |
| --- | --- | --- | --- |
| **CCVI** | ND-GAIN | `CCVI_Score`, `CON_Risk`, `CLI_Risk` | Matched via ISO3 + Year |
| **HDR** | UNDP | `GII`, `GDI`, `HDI` | Pivoted wide by indicator |
| **ND-GAIN** | Notre Dame | `Vulnerability`, `Readiness` | Linear interpolation for missing years |

---

## 3. Data Integration Methodology

### 3.1 Step 1: CRS Data Aggregation

```python
agg_dict = {
    # Financial metrics
    'USD_Commitment': ['sum', 'mean'],
    'USD_Disbursement': ['sum', 'mean'],
    'USD_Received': ['sum', 'mean'],
    'ProjectNumber': 'count',
    
    # Gender metrics
    'Gender': [
        ('gender_focused_count', lambda x: (x == 1).sum()),
        ('gender_focused_perc', lambda x: (x == 1).mean()),
        ('gender_focused_amount', lambda x: df_clean.loc[x.index, 'USD_Commitment'][x == 1].sum())
    ],
    
    # Climate/environment
    'Environment': ['sum', 'mean'],
    'ClimateMitigation': ['sum', 'mean'],
    'ClimateAdaptation': [
        ('climate_adaptation_count', lambda x: (x == 1).sum()),
        ('climate_adaptation_perc', lambda x: (x == 1).mean())
    ],
    
    # Sector information
    'SectorName': [
        ('primary_sector', safe_mode),
        ('sector_diversity', 'nunique')
    ],
    
    # String columns
    'RecipientName': safe_first,
    'RegionName': safe_first,
    'IncomegroupName': safe_first,
    
    # SDG information
    'SDGfocus': [
        ('sdg_count', 'size'),
        ('primary_sdg', safe_mode)
    ]
}
agg_results = df_clean.groupby(['DERecipientcode', 'Year']).agg(agg_dict)
```

### **3.2 Step 2: Time Alignment**

Created a complete country-year grid (197 countries × 10 years) to handle missing data:

python

```python
all_years = pd.DataFrame({
    'Year': range(2014, 2024),
    'key': 1
})
all_countries = pd.DataFrame({
    'iso3': valid_iso3_list,
    'key': 1
})
master_grid = pd.merge(all_countries, all_years, on='key')
```

### **3.3 Step 3: Merging Process**

Used left joins to preserve all country-years, with validation checks:

python

```python
# 1. Load CRS data (already aggregated)
    crs_agg = pd.read_csv(crs_agg_path).rename(columns={
        'DERecipientcode': 'iso3',
        'RecipientName_safe_first': 'country_name'
    }).drop(columns=['Unnamed: 0'])

    # 2. Create country-year reference grid
    countries = crs_agg['iso3'].unique()
    years = range(2014, 2024)
    country_years = pd.DataFrame(
        [(iso3, year) for iso3 in countries for year in years],
        columns=['iso3', 'Year']
    )

    # 3. Load and prepare CCVI data
    ccvi = pd.read_csv(ccvi_path).rename(columns={
        'year': 'Year',
        'Name': 'country_name_ccvi'
    })[['iso3', 'Year', 'CCVI', 'CON_risk', 'CLI_risk', 'country_name_ccvi']]

    # 4. Load and prepare HDR data
    hdr = pd.read_csv(hdr_path).rename(columns={
        'CountryCode': 'iso3'
    })[['iso3', 'Year', 'gdi', 'gii', 'hdi', 'hdicode']]

    # 5. Load and prepare ND-GAIN data
    nd_gain = pd.read_csv(nd_gain_path).rename(columns={
        'ISO3': 'iso3'
    })[['iso3', 'Year', 'ND_GAIN_Score', 'Vulnerability', 'Readiness']]

    # 6. Execute merge sequence
    with ProgressBar():
        merged = (
            country_years
            .merge(crs_agg, on=['iso3', 'Year'], how='left')
            .merge(ccvi, on=['iso3', 'Year'], how='left')
            .merge(hdr, on=['iso3', 'Year'], how='left')
            .merge(nd_gain, on=['iso3', 'Year'], how='left')
        )
    
    # 7. Handle country names - CORRECTED VERSION
    if 'country_name_ccvi' in merged.columns:
        # Fill missing country names from CCVI data where available
        merged['country_name'] = merged['country_name'].combine_first(merged['country_name_ccvi'])
        merged = merged.drop(columns=['country_name_ccvi'])
    
    # 8. Type optimization
    float_cols = merged.select_dtypes(include='float64').columns
    merged[float_cols] = merged[float_cols].astype('float32')
    
    int_cols = ['Year', 'ProjectCount']
    for col in int_cols:
        if col in merged.columns:
            merged[col] = pd.to_numeric(merged[col], downcast='integer')
    
    # 9. Save optimized output
    merged.to_parquet(output_path, engine='pyarrow')
    print(f"Successfully merged {len(merged)} country-year records")
    
    
    return merged
```

---

## **4. Feature Engineering**

### **4.1 Core Metrics**

| **Metric** | **Formula** | **Scale** | **Description** |
| --- | --- | --- | --- |
| **Gender Focus** | **`(Gender_marked_projects / Total_projects)`** | 0-1 | % of gender-targeted aid |
| **Climate Intensity** | **`(Climate_projects / Total_projects)`** | 0-1 | Climate relevance score |
| **Synergy Score** | **`Gender_Focus × Climate_Intensity × log(Funding)`** | 0-6 | Combined effectiveness metric |

4.1.1

```python
    
    # VULNERABILITY COMPOSITES 
    
    vuln_metrics = []
    if 'CCVI' in df.columns:
        vuln_metrics.append('CCVI')
    if 'CON_risk' in df.columns:
        vuln_metrics.append('CON_risk')
    if 'CLI_risk' in df.columns:
        vuln_metrics.append('CLI_risk')
    if 'Vulnerability' in df.columns:
        vuln_metrics.append('Vulnerability')
    
    if vuln_metrics:
        # Normalize each metric first
        normalized = df[vuln_metrics].apply(lambda x: (x - x.min()) / (x.max() - x.min()))
        
        # Apply weights (CCVI gets 2x weight)
        weights = [2.0 if m == 'CCVI' else 1.0 for m in vuln_metrics]
        weighted = normalized.mul(weights, axis=1)
        
        # Create composite
        df['composite_vulnerability'] = weighted.mean(axis=1)
    
    
    # GENDER-CLIMATE SYNERGY FEATURES 
    
    # Create unified climate marker
    climate_conditions = [
        (df['ClimateMitigation_mean'] > 0) | 
        (df['ClimateAdaptation_climate_adaptation_count'] > 0),
        (df['Environment_mean'] > 0)
    ]
    df['Climate_Intensity'] = np.select(
        climate_conditions, 
        [1.0, 0.5], 
        default=0.0
    )
    
    # Gender-climate synergy index
    df['Gender_Climate_Synergy'] = (
        df['Gender_gender_focused_perc'] * 
        df['Climate_Intensity'] * 
        np.log1p(df['USD_Commitment_sum'])
    )
    
   
    # SECTOR & SDG FEATURES

    # Sector concentration index (0-1)
    if 'SectorName_sector_diversity' in df.columns:
        max_diversity = df.groupby('Year')['SectorName_sector_diversity'].transform('max')
        df['Sector_Concentration'] = 1 - (df['SectorName_sector_diversity'] / max_diversity.replace(0, 1))
    
    # SDG alignment score
    if 'SDGfocus_sdg_count' in df.columns:
        df['SDG_Alignment'] = (
            df['SDGfocus_sdg_count'] / 
            df['ProjectCount'].replace(0, 1)
        )
    
    
    #  READINESS-VULNERABILITY MATRIX 
    
    if all(col in df.columns for col in ['Vulnerability', 'Readiness']):
        df['Vulnerability_Quartile'] = pd.qcut(
            df['Vulnerability'], 
            4, 
            labels=['Low', 'Medium', 'High', 'Extreme']
        )
        df['Readiness_Quartile'] = pd.qcut(
            df['Readiness'], 
            4, 
            labels=['Low', 'Medium', 'High', 'Very High']
        )
        df['Vuln_Readiness_Profile'] = (
            df['Vulnerability_Quartile'].astype(str) + "_" + 
            df['Readiness_Quartile'].astype(str)
        )
    
    
    #  FINANCIAL EFFICIENCY METRICS
    
    # Commitment-to-disbursement ratio
    df['Commitment_Efficiency'] = (
        df['USD_Disbursement_sum'] / 
        df['USD_Commitment_sum'].replace(0, np.nan)
    )
    
    # Gender-focused dollars per capita
    if 'EXP_pop_count_raw' in df.columns:
        df['Gender_Investment_PC'] = (
            df['Gender_gender_focused_amount'] / 
            df['EXP_pop_count_raw'].replace(0, 1)
        )
    
    print("✅ Feature engineering complete")
    return df
```

---

## **5. Data Quality Assurance**

### **5.1 Validation Checks**

| **Test** | **Method** | **Pass Criteria** |
| --- | --- | --- |
| **ISO3 Coverage** | **`df['iso3'].nunique()`** | 145 countries |
| **Temporal Continuity** | **`df.groupby('iso3')['Year'].count()`** | ≥7 years per country |
| **Value Ranges** | **`df.describe()`** | Financials ≥0, Scores in defined bounds |

### **5.2 Missing Data Handling**

| **Variable** | **Imputation Method** |
| --- | --- |
| CCVI | Linear interpolation (max 2-year gap) |
| HDI | Regional median imputation |
| Climate Markers | 0 (assumed non-climate) |

---

## **6. Final Dataset Specifications**

### **6.1 File Details**

| **Attribute** | **Value** |
| --- | --- |
| **Format** | Parquet (compressed) |
| **Dimensions** | 1450 rows × 47 columns |
| **Primary Key** | **`iso3 + Year`** |

### **6.2 Column Taxonomy**

| **Category** | **Example Variables** |
| --- | --- |
| **Financial** | **`USD_Commitment_sum`**, **`Disbursement_mean`** |
| **Gender** | **`GII`**, **`Gender_Focus_Perc`** |
| **Environment** | **`Vulnerability`**, **`Readiness`** |
| **Derived Metrics** | **`Synergy_Score`**, **`ESI`*** |
- ***Composite Indices**

**Environmental Stress Index (ESI):**

math

```
ESI = 0.5 \times Vulnerability + 0.3 \times CCVI + 0.2 \times CON\_risk
```

**Adjusted Calculation (v2.1):**

python

```
df['Synergy_Score'] = (
    (df['Gender_Focus'] ** 0.7) *
    (df['ESI'] ** 0.5) *
    np.log1p(df['USD_Commitment'] / 1e6)
).clip(0, 6)
```
