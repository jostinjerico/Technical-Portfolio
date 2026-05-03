import pandas as pd
import os

def preprocess_nd_gain_data(base_path, output_filename='data/processed/ng_gain/nd_gain_data.csv'):
    """
    Loads, reshapes, merges, and cleans ND-GAIN data.

    Args:
        base_path (str): The path to the 'resources' directory of the unzipped ND-GAIN data.
        output_filename (str): The name of the final cleaned CSV file.
    """
    print("--- Starting ND-GAIN Data Preprocessing ---")

    # Define paths to the core CSV files
    gain_path = os.path.join(base_path, 'gain', 'gain.csv')
    vulnerability_path = os.path.join(base_path, 'vulnerability', 'vulnerability.csv')
    readiness_path = os.path.join(base_path, 'readiness', 'readiness.csv')

    try:
        # Load the datasets
        df_gain = pd.read_csv(gain_path)
        df_vulnerability = pd.read_csv(vulnerability_path)
        df_readiness = pd.read_csv(readiness_path)
        print("Successfully loaded raw GAIN, Vulnerability, and Readiness files.")
    except FileNotFoundError as e:
        print(f"Error: Could not find a necessary file. {e}")
        return

    def reshape_data(df, value_name):
        """
        Reshapes a dataframe from wide format (years as columns) to long format.
        """
        # Identify columns to keep as identifiers
        id_vars = ['Name', 'ISO3']
        # Melt the dataframe to turn year columns into rows
        df_long = pd.melt(df, id_vars=id_vars, var_name='Year', value_name=value_name)
        # Convert Year to numeric, coercing any errors
        df_long['Year'] = pd.to_numeric(df_long['Year'], errors='coerce')
        # Drop rows where 'Year' could not be converted (e.g., non-year columns)
        df_long.dropna(subset=['Year'], inplace=True)
        df_long['Year'] = df_long['Year'].astype(int)
        return df_long

    # Reshape each dataframe
    print("Reshaping data from wide to long format...")
    gain_long = reshape_data(df_gain, 'ND_GAIN_Score')
    vulnerability_long = reshape_data(df_vulnerability, 'Vulnerability')
    readiness_long = reshape_data(df_readiness, 'Readiness')

    # Merge the three dataframes into a single master file
    print("Merging the reshaped dataframes...")
    df_merged = pd.merge(gain_long, vulnerability_long, on=['Name', 'ISO3', 'Year'], how='left')
    df_final = pd.merge(df_merged, readiness_long, on=['Name', 'ISO3', 'Year'], how='left')

    # Final cleaning and inspection
    df_final.dropna(subset=['ND_GAIN_Score'], inplace=True) # Keep only rows with a valid GAIN score
    
    # Save the cleaned data to a new CSV file
    try:
        df_final.to_csv(output_filename, index=False)
        print(f"\n--- Preprocessing Complete! ---")
        print(f"Cleaned data saved to: '{output_filename}'")
        
        
    except Exception as e:
        print(f"\nError saving the file: {e}")

if __name__== '__main__':

    resources_path = 'data/raw/nd_gain/gain/gain.csv' 
    preprocess_nd_gain_data(resources_path)