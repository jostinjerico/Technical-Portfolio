import pandas as pd
import numpy as np
import json
from pathlib import Path

# Configuration
INPUT_FILE = 'public/data/raw/crs_data_final_v2.csv'
OUTPUT_FILE = 'data_analysis_results.txt'

# Read the data
df = pd.read_csv(INPUT_FILE)

# Open file for writing
with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    # Write column names
    f.write("=" * 80 + "\n")
    f.write("COLUMNS\n")
    f.write("=" * 80 + "\n")
    f.write(f"{df.columns.tolist()}\n\n")
    
    # Write shape
    f.write("=" * 80 + "\n")
    f.write("SHAPE\n")
    f.write("=" * 80 + "\n")
    f.write(f"Rows: {df.shape[0]}, Columns: {df.shape[1]}\n\n")
    
    # Write first 2 rows
    f.write("=" * 80 + "\n")
    f.write("HEAD (First 2 Rows)\n")
    f.write("=" * 80 + "\n")
    f.write(df.head(2).to_string())
    f.write("\n\n")

print(f"Results saved to {OUTPUT_FILE}")

# Also print to console
print("COLS", df.columns.tolist())
print("\nSHAPE", df.shape)
print("\nHEAD\n", df.head(2))