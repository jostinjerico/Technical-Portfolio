import pandas as pd
import numpy as np
from pathlib import Path
import os

def load_and_process_ccvi(data_dir, output_dir):
    """Load and process CCVI data with proper handling of multi-indexes"""
    try:
        # 1. Load base grid - note it has pgid in the index
        base_grid = pd.read_parquet(Path(data_dir) / 'base_grid.parquet')
        base_grid = base_grid.reset_index()  # Move pgid from index to column
        print("\nBase Grid after reset_index():")
        print(base_grid.head(2))
        
        # 2. Load exposure data (has multi-index: pgid, year, quarter)
        exposure = pd.read_parquet(Path(data_dir) / 'exposure_layers.parquet')
        exposure = exposure.reset_index()
        print("\nExposure after reset_index():")
        print(exposure.head(2))
        
        # 3. Load scores data (has multi-index: pgid, year, quarter)
        scores = pd.read_parquet(Path(data_dir) / 'ccvi_scores.parquet')
        scores = scores.reset_index()
        print("\nScores after reset_index():")
        print(scores.head(2))
        
        # 4. Verify we have the required columns
        required_columns = {
            'base_grid': ['pgid', 'iso3'],
            'exposure': ['pgid', 'year', 'quarter'],
            'scores': ['pgid', 'year', 'quarter']
        }
        
        for df_name, df in [('base_grid', base_grid), 
                           ('exposure', exposure), 
                           ('scores', scores)]:
            missing = set(required_columns[df_name]) - set(df.columns)
            if missing:
                raise ValueError(f"Missing columns in {df_name}: {missing}")
        
        # 5. Merge data with country information
        exposure = exposure.merge(
            base_grid[['pgid', 'iso3']],
            on='pgid',
            how='left'
        )
        
        scores = scores.merge(
            base_grid[['pgid', 'iso3']],
            on='pgid',
            how='left'
        )
        
        # 6. Create country-level aggregations
        # Annual country exposure
        annual_exposure = exposure.groupby(['iso3', 'year']).agg({
            'EXP_pop_density': 'mean',
            'EXP_pop_count_raw': 'sum',
            'EXP_pop_density_raw': 'mean'
        }).reset_index()
        
        # Annual country scores
        annual_scores = scores.groupby(['iso3', 'year']).agg({
            'CCVI': 'mean',
            'CON_risk': 'mean',
            'CLI_risk': 'mean'
        }).reset_index()
        
        # 7. Create latest snapshot
        latest_snapshot = annual_scores.sort_values(['iso3', 'year'])\
                                     .groupby('iso3')\
                                     .last()\
                                     .reset_index()
        
        # 8. Save results
        os.makedirs(output_dir, exist_ok=True)
        
        # Combined annual country data
        annual_country = pd.merge(
            annual_scores,
            annual_exposure,
            on=['iso3', 'year'],
            how='left'
        )
        annual_country.to_csv(Path(output_dir) / 'ccvi_annual_country.csv', index=False)
        
        # Latest snapshot
        latest_snapshot.to_csv(Path(output_dir) / 'ccvi_annual_country.csv', index=False)
        
        print("\nProcessing completed successfully!")
        print(f"Saved files to {output_dir}:")
        
    except Exception as e:
        print(f"\nError during processing: {str(e)}")
        print("Please check the data files and their structure.")

def main():
    # Configuration - use absolute paths
    data_dir = 'data/raw/ccvi'
    output_dir = 'data/processed/ccvi'
    
    print("Starting CCVI data processing...")
    load_and_process_ccvi(data_dir, output_dir)

if __name__ == "__main__":
    main()