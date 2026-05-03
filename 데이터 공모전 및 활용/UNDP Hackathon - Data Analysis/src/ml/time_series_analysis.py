import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from scipy.stats import pearsonr
import warnings
warnings.filterwarnings('ignore')

# Set style for better visualizations
plt.style.use('default')
sns.set_palette("husl")

def load_and_validate_data(filepath):
    """Load and validate the dataset"""
    try:
        df = pd.read_csv(filepath)
        print(f"Dataset loaded successfully: {df.shape[0]} rows, {df.shape[1]} columns")
        
        # Check for required columns
        required_cols = ['Year', 'Gender_Climate_Synergy', 'USD_Commitment_sum', 
                        'composite_vulnerability', 'iso3', 'country_name_verified']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            print(f"Warning: Missing columns: {missing_cols}")
        
        return df
    except FileNotFoundError:
        print(f"Error: File {filepath} not found")
        return None
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

def calculate_yearly_trends(df):
    """Calculate yearly aggregated trends"""
    yearly_trends = df.groupby('Year').agg({
        'Gender_Climate_Synergy': ['mean', 'std', 'count'],
        'USD_Commitment_sum': ['sum', 'mean', 'std'],
        'composite_vulnerability': ['mean', 'std']
    }).reset_index()
    
    # Flatten column names
    yearly_trends.columns = ['_'.join(col).strip() if col[1] else col[0] 
                           for col in yearly_trends.columns.values]
    yearly_trends.rename(columns={'Year_': 'Year'}, inplace=True)
    
    return yearly_trends

def analyze_trends(yearly_trends):
    """Perform statistical trend analysis"""
    results = {}
    
    # Calculate trend slopes and significance
    metrics = {
        'Gender_Climate_Synergy_mean': 'Gender-Climate Synergy',
        'USD_Commitment_sum_sum': 'Total Funding',
        'USD_Commitment_sum_mean': 'Average Funding',
        'composite_vulnerability_mean': 'Composite Vulnerability'
    }
    
    for col, label in metrics.items():
        if col in yearly_trends.columns:
            slope, intercept, r_value, p_value, std_err = stats.linregress(
                yearly_trends['Year'], yearly_trends[col]
            )
            
            results[label] = {
                'slope': slope,
                'r_squared': r_value**2,
                'p_value': p_value,
                'trend': 'Increasing' if slope > 0 else 'Decreasing',
                'significant': p_value < 0.05
            }
    
    return results

def analyze_country_trends(df, min_years=3):
    """Analyze trends by country"""
    def calculate_country_trend(group):
        if len(group) < min_years:
            return pd.Series({
                'synergy_slope': np.nan,
                'synergy_r2': np.nan,
                'synergy_pvalue': np.nan,
                'funding_slope': np.nan,
                'data_points': len(group)
            })
        
        # Synergy trend
        syn_slope, _, syn_r, syn_p, _ = stats.linregress(group['Year'], group['Gender_Climate_Synergy'])
        
        # Funding trend (handle zero/negative values)
        funding_data = group['USD_Commitment_sum'].replace(0, np.nan).dropna()
        if len(funding_data) >= min_years:
            fund_slope, _, _, _, _ = stats.linregress(
                group.loc[funding_data.index, 'Year'], 
                np.log1p(funding_data)  # log transform for funding
            )
        else:
            fund_slope = np.nan
        
        return pd.Series({
            'synergy_slope': syn_slope,
            'synergy_r2': syn_r**2,
            'synergy_pvalue': syn_p,
            'funding_slope': fund_slope,
            'data_points': len(group)
        })
    
    country_trends = df.groupby(['iso3', 'country_name_verified']).apply(calculate_country_trend).reset_index()
    country_trends = country_trends.dropna(subset=['synergy_slope'])
    
    return country_trends

def create_visualizations(df, yearly_trends, trend_results, country_trends):
    """Create comprehensive visualizations"""
    
    # Create figure with subplots
    fig = plt.figure(figsize=(20, 24))
    
    # 1. Overall Trends Over Time
    ax1 = plt.subplot(4, 2, 1)
    ax1_twin = ax1.twinx()
    
    # Plot synergy trend
    line1 = ax1.plot(yearly_trends['Year'], yearly_trends['Gender_Climate_Synergy_mean'], 
                     'o-', color='#2E8B57', linewidth=2, markersize=6, label='Gender-Climate Synergy')
    ax1.fill_between(yearly_trends['Year'], 
                     yearly_trends['Gender_Climate_Synergy_mean'] - yearly_trends['Gender_Climate_Synergy_std'],
                     yearly_trends['Gender_Climate_Synergy_mean'] + yearly_trends['Gender_Climate_Synergy_std'],
                     alpha=0.2, color='#2E8B57')
    
    # Plot funding trend
    line2 = ax1_twin.plot(yearly_trends['Year'], yearly_trends['USD_Commitment_sum_sum']/1e6, 
                          's-', color='#FF6B35', linewidth=2, markersize=6, label='Total Funding (Million USD)')
    
    ax1.set_xlabel('Year', fontsize=12)
    ax1.set_ylabel('Gender-Climate Synergy Score', color='#2E8B57', fontsize=12)
    ax1_twin.set_ylabel('Total Funding (Million USD)', color='#FF6B35', fontsize=12)
    ax1.tick_params(axis='y', labelcolor='#2E8B57')
    ax1_twin.tick_params(axis='y', labelcolor='#FF6B35')
    ax1.set_title('Temporal Trends: Gender-Climate Synergy vs Funding', fontsize=14, fontweight='bold')
    ax1.grid(True, alpha=0.3)
    
    # Add trend lines
    z1 = np.polyfit(yearly_trends['Year'], yearly_trends['Gender_Climate_Synergy_mean'], 1)
    p1 = np.poly1d(z1)
    ax1.plot(yearly_trends['Year'], p1(yearly_trends['Year']), "--", color='#2E8B57', alpha=0.8, linewidth=2)
    
    # 2. Vulnerability vs Synergy Correlation
    ax2 = plt.subplot(4, 2, 2)
    scatter = ax2.scatter(df['composite_vulnerability'], df['Gender_Climate_Synergy'], 
                         c=df['Year'], cmap='viridis', alpha=0.6, s=50)
    
    # Add correlation line
    if not df[['composite_vulnerability', 'Gender_Climate_Synergy']].isna().any().any():
        z = np.polyfit(df['composite_vulnerability'], df['Gender_Climate_Synergy'], 1)
        p = np.poly1d(z)
        ax2.plot(df['composite_vulnerability'], p(df['composite_vulnerability']), "r--", alpha=0.8, linewidth=2)
        
        # Calculate correlation
        corr, p_val = pearsonr(df['composite_vulnerability'].dropna(), 
                              df['Gender_Climate_Synergy'].dropna())
        ax2.text(0.05, 0.95, f'r = {corr:.3f}\np = {p_val:.3f}', 
                transform=ax2.transAxes, bbox=dict(boxstyle="round", facecolor='wheat', alpha=0.8))
    
    ax2.set_xlabel('Composite Vulnerability', fontsize=12)
    ax2.set_ylabel('Gender-Climate Synergy', fontsize=12)
    ax2.set_title('Vulnerability vs Synergy Relationship', fontsize=14, fontweight='bold')
    plt.colorbar(scatter, ax=ax2, label='Year')
    ax2.grid(True, alpha=0.3)
    
    # 3. Country Trend Distribution
    ax3 = plt.subplot(4, 2, 3)
    valid_slopes = country_trends['synergy_slope'].dropna()
    ax3.hist(valid_slopes, bins=30, alpha=0.7, color='skyblue', edgecolor='black')
    ax3.axvline(x=0, color='red', linestyle='--', linewidth=2, label='No Change')
    ax3.axvline(x=valid_slopes.mean(), color='orange', linestyle='-', linewidth=2, 
               label=f'Mean = {valid_slopes.mean():.4f}')
    ax3.set_xlabel('Synergy Trend Slope', fontsize=12)
    ax3.set_ylabel('Number of Countries', fontsize=12)
    ax3.set_title('Distribution of Country-Level Synergy Trends', fontsize=14, fontweight='bold')
    ax3.legend()
    ax3.grid(True, alpha=0.3)
    
    # 4. Top and Bottom Performers
    ax4 = plt.subplot(4, 2, 4)
    top_5 = country_trends.nlargest(5, 'synergy_slope')
    bottom_5 = country_trends.nsmallest(5, 'synergy_slope')
    
    combined = pd.concat([top_5, bottom_5])
    colors = ['green']*5 + ['red']*5
    
    bars = ax4.barh(range(len(combined)), combined['synergy_slope'], color=colors, alpha=0.7)
    ax4.set_yticks(range(len(combined)))
    ax4.set_yticklabels([name[:15] + '...' if len(name) > 15 else name 
                        for name in combined['country_name_verified']], fontsize=10)
    ax4.set_xlabel('Synergy Trend Slope', fontsize=12)
    ax4.set_title('Top 5 Improving vs Bottom 5 Declining Countries', fontsize=14, fontweight='bold')
    ax4.axvline(x=0, color='black', linestyle='-', alpha=0.5)
    ax4.grid(True, alpha=0.3, axis='x')
    
    # 5. Funding Distribution Over Time
    ax5 = plt.subplot(4, 2, 5)
    
    # Create box plot of funding by year
    years = sorted(df['Year'].unique())
    funding_by_year = [df[df['Year'] == year]['USD_Commitment_sum'].values for year in years]
    
    box_plot = ax5.boxplot(funding_by_year, labels=years, patch_artist=True)
    for patch in box_plot['boxes']:
        patch.set_facecolor('lightblue')
        patch.set_alpha(0.7)
    
    ax5.set_xlabel('Year', fontsize=12)
    ax5.set_ylabel('USD Commitment (Log Scale)', fontsize=12)
    ax5.set_yscale('log')
    ax5.set_title('Funding Distribution by Year', fontsize=14, fontweight='bold')
    ax5.grid(True, alpha=0.3)
    
    # 6. Regional Analysis (if region data available)
    ax6 = plt.subplot(4, 2, 6)
    
    # Aggregate by country for regional view
    country_avg = df.groupby('country_name_verified').agg({
        'Gender_Climate_Synergy': 'mean',
        'USD_Commitment_sum': 'mean',
        'composite_vulnerability': 'mean'
    }).reset_index()
    
    # Create bubble chart
    scatter = ax6.scatter(country_avg['composite_vulnerability'], 
                         country_avg['Gender_Climate_Synergy'],
                         s=np.log1p(country_avg['USD_Commitment_sum'])*20,
                         alpha=0.6, c=country_avg['USD_Commitment_sum'], 
                         cmap='plasma')
    
    ax6.set_xlabel('Average Vulnerability', fontsize=12)
    ax6.set_ylabel('Average Synergy Score', fontsize=12)
    ax6.set_title('Country Performance: Vulnerability vs Synergy\n(Bubble size = Funding)', 
                 fontsize=14, fontweight='bold')
    plt.colorbar(scatter, ax=ax6, label='Average Funding (USD)')
    ax6.grid(True, alpha=0.3)
    
    # 7. Time Series Decomposition-style plot
    ax7 = plt.subplot(4, 2, 7)
    
    # Plot multiple metrics normalized
    metrics_to_plot = {
        'Gender_Climate_Synergy_mean': 'Synergy Score',
        'composite_vulnerability_mean': 'Vulnerability',
        'USD_Commitment_sum_mean': 'Avg Funding'
    }
    
    for col, label in metrics_to_plot.items():
        if col in yearly_trends.columns:
            # Normalize to 0-1 scale for comparison
            data = yearly_trends[col]
            normalized = (data - data.min()) / (data.max() - data.min())
            ax7.plot(yearly_trends['Year'], normalized, 'o-', linewidth=2, 
                    label=label, markersize=6)
    
    ax7.set_xlabel('Year', fontsize=12)
    ax7.set_ylabel('Normalized Values (0-1)', fontsize=12)
    ax7.set_title('Normalized Trends Comparison', fontsize=14, fontweight='bold')
    ax7.legend()
    ax7.grid(True, alpha=0.3)
    
    # 8. Statistical Summary
    ax8 = plt.subplot(4, 2, 8)
    ax8.axis('off')
    
    # Create summary text
    summary_text = "Statistical Analysis Summary\n" + "="*40 + "\n\n"
    
    for metric, results in trend_results.items():
        significance = "***" if results['p_value'] < 0.001 else "**" if results['p_value'] < 0.01 else "*" if results['p_value'] < 0.05 else ""
        summary_text += f"{metric}:\n"
        summary_text += f"  Trend: {results['trend']}\n"
        summary_text += f"  Slope: {results['slope']:.6f}{significance}\n"
        summary_text += f"  R²: {results['r_squared']:.4f}\n"
        summary_text += f"  p-value: {results['p_value']:.4f}\n\n"
    
    # Add country statistics
    improving_countries = len(country_trends[country_trends['synergy_slope'] > 0])
    total_countries = len(country_trends)
    
    summary_text += f"Country Analysis:\n"
    summary_text += f"  Countries improving: {improving_countries}/{total_countries} ({improving_countries/total_countries*100:.1f}%)\n"
    summary_text += f"  Average slope: {country_trends['synergy_slope'].mean():.6f}\n"
    summary_text += f"  Std deviation: {country_trends['synergy_slope'].std():.6f}"
    
    ax8.text(0.05, 0.95, summary_text, transform=ax8.transAxes, fontsize=10,
             verticalalignment='top', fontfamily='monospace',
             bbox=dict(boxstyle="round,pad=0.5", facecolor='lightgray', alpha=0.8))
    
    plt.tight_layout(pad=3.0)
    return fig

def save_results(df, yearly_trends, trend_results, country_trends, output_dir='output'):
    """Save analysis results"""
    import os
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Save the visualization
    fig = create_visualizations(df, yearly_trends, trend_results, country_trends)
    
    # Save as PNG with high DPI
    png_path = os.path.join(output_dir, 'time_series_analysis.png')
    fig.savefig(png_path, dpi=300, bbox_inches='tight', facecolor='white')
    print(f"Visualization saved as: {png_path}")
    
    # Save as PDF as well
    pdf_path = os.path.join(output_dir, 'time_series_analysis.pdf')
    fig.savefig(pdf_path, bbox_inches='tight', facecolor='white')
    print(f"PDF version saved as: {pdf_path}")
    
    # Save data tables
    yearly_trends.to_csv(os.path.join(output_dir, 'yearly_trends.csv'), index=False)
    country_trends.to_csv(os.path.join(output_dir, 'country_trends.csv'), index=False)
    
    # Save summary statistics
    with open(os.path.join(output_dir, 'trend_analysis_summary.txt'), 'w') as f:
        f.write("Time Series Analysis Summary\n")
        f.write("="*50 + "\n\n")
        
        for metric, results in trend_results.items():
            f.write(f"{metric}:\n")
            f.write(f"  Trend: {results['trend']}\n")
            f.write(f"  Slope: {results['slope']:.8f}\n")
            f.write(f"  R-squared: {results['r_squared']:.6f}\n")
            f.write(f"  P-value: {results['p_value']:.6f}\n")
            f.write(f"  Significant: {results['significant']}\n\n")
    
    print(f"Analysis complete! Results saved in '{output_dir}' directory")
    return fig

def main():
    """Main analysis function"""
    print("Starting Enhanced Time-Series Analysis...")
    print("="*50)
    
    # Load data
    df = load_and_validate_data('data/final_composed/final_composite.csv')
    if df is None:
        return
    
    # Calculate yearly trends
    print("\nCalculating yearly trends...")
    yearly_trends = calculate_yearly_trends(df)
    
    # Analyze overall trends
    print("Analyzing statistical trends...")
    trend_results = analyze_trends(yearly_trends)
    
    # Analyze country-level trends
    print("Analyzing country-level trends...")
    country_trends = analyze_country_trends(df)
    
    # Print results
    print("\n" + "="*50)
    print("ANALYSIS RESULTS")
    print("="*50)
    
    for metric, results in trend_results.items():
        significance = " (significant)" if results['significant'] else " (not significant)"
        print(f"\n{metric}:")
        print(f"  Trend: {results['trend']}{significance}")
        print(f"  Annual change rate: {results['slope']:.6f}")
        print(f"  Variance explained (R²): {results['r_squared']:.4f}")
    
    # Top performers
    print(f"\nTop 5 Countries with Improving Gender-Climate Synergy:")
    top_improvers = country_trends.nlargest(5, 'synergy_slope')
    for idx, row in top_improvers.iterrows():
        print(f"  {row['country_name_verified']}: {row['synergy_slope']:.6f} annual improvement")
    
    print(f"\nBottom 5 Countries (Declining Trends):")
    bottom_performers = country_trends.nsmallest(5, 'synergy_slope')
    for idx, row in bottom_performers.iterrows():
        print(f"  {row['country_name_verified']}: {row['synergy_slope']:.6f} annual change")
    
    # Create and save visualizations
    print(f"\nCreating visualizations...")
    fig = save_results(df, yearly_trends, trend_results, country_trends)
    
    plt.show()

if __name__ == "__main__":
    main()