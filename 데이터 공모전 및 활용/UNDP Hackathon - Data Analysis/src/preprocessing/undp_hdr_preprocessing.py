import pandas as pd 
import re 

def preprocess_undp_hdr_data(filename='data/raw/undp_hdr/HDR25_Composite_indices_complete_time_series.csv'):
    """
    Loads and preprocesses UNDP HDR data with focus on gender indicators (2014-2023).
    Returns a cleaned DataFrame with country, year, and selected gender/development indicators.
    """
    try:
        # Load raw data with explicit encoding
        df = pd.read_csv(filename, encoding='ISO-8859-1', low_memory=False)

        # Define key gender-related indicators to keep
        gender_indicators = {
            'gii': 'Gender Inequality Index',
            'gdi': 'Gender Development Index',
            'hdi': 'Human Development Index',
            'mmr': 'Maternal Mortality Ratio',
            'se_f': 'Female Secondary Education',
            'pr_f': 'Female Parliamentary Representation'
        }

        # Filter columns - keep ISO3, country name, year columns for selected indicators
        keep_cols = ['iso3', 'country']
        keep_cols += [col for col in df.columns 
                     if any(ind in col.lower() for ind in gender_indicators.keys()) 
                     and re.search(r'_\d{4}$', col)]
        
        df = df[keep_cols]

        # Melt to long format
        id_vars = ['iso3', 'country']
        df = pd.melt(df, id_vars=id_vars, var_name='indicator_year', value_name='value')
        
        # Extract year and indicator
        df['year'] = df['indicator_year'].str.extract(r'_(\d{4})$').astype(int)
        df['indicator'] = df['indicator_year'].str.replace(r'_\d{4}$', '', regex=True)
        
        # Filter to 2014-2023
        df = df[df['year'].between(2014, 2023)]
        
        # Pivot to wide format (one row per country-year)
        df = (df.pivot_table(index=['iso3', 'country', 'year'], 
                            columns='indicator', 
                            values='value')
              .reset_index()
              .rename_axis(None, axis=1))
        
        # Standardize column names
        df.columns = df.columns.str.lower()
        df = df.rename(columns={
            'iso3': 'CountryCode',
            'country': 'Name',
            'year': 'Year'
        })

        # Add metadata columns
        df['hdicode'] = df['hdi'].apply(
            lambda x: 'Very High' if x >= 0.8 else 
                    'High' if x >= 0.7 else
                    'Medium' if x >= 0.55 else 'Low')
        
        
        return df

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

if __name__ =='__main__':

    hdr_clean = preprocess_undp_hdr_data()
    if hdr_clean is not None:
        hdr_clean.to_csv('data/processed/undp_hdr/undp_hdr_data.csv', index=False)