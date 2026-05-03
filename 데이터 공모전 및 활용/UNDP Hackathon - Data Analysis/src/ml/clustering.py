from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from sklearn.decomposition import PCA


df = pd.read_csv('data/final_data_only_countries.csv')

# Select key features for clustering
cluster_features = [
    'composite_vulnerability', 
    'Gender_Climate_Synergy', 
    'Commitment_Efficiency',
    'USD_Commitment_sum',
    'Climate_Intensity'
]



# Standardize and cluster
scaler = StandardScaler()
X_scaled = scaler.fit_transform(df[cluster_features].fillna(0))
kmeans = KMeans(n_clusters=4, random_state=42)
df['Country_Profile'] = kmeans.fit_predict(X_scaled)

# Create profile labels
profile_map = {
    0: "High-Need, Low-Investment",
    1: "Climate-Priority Recipients", 
    2: "Gender-Focus Leaders",
    3: "Balanced Development Partners"
}
df['Profile_Label'] = df['Country_Profile'].map(profile_map)

# Set up the plotting style
plt.style.use('default')
sns.set_palette("husl")

# Create a comprehensive visualization
fig = plt.figure(figsize=(20, 16))

# 1. PCA Scatter Plot (Main clustering visualization)
ax1 = plt.subplot(2, 3, 1)
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)
df_plot = df.copy()
df_plot['PCA1'] = X_pca[:, 0]
df_plot['PCA2'] = X_pca[:, 1]

colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
for i, (profile, color) in enumerate(zip(profile_map.values(), colors)):
    mask = df_plot['Profile_Label'] == profile
    plt.scatter(df_plot[mask]['PCA1'], df_plot[mask]['PCA2'], 
               c=color, label=profile, alpha=0.7, s=60)

plt.xlabel(f'PCA Component 1 ({pca.explained_variance_ratio_[0]:.1%} variance)')
plt.ylabel(f'PCA Component 2 ({pca.explained_variance_ratio_[1]:.1%} variance)')
plt.title('Country Profiles: K-Means Clustering Results', fontsize=14, fontweight='bold')
plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
plt.grid(True, alpha=0.3)

# 2. Feature Importance Heatmap
ax2 = plt.subplot(2, 3, 2)
cluster_centers = scaler.inverse_transform(kmeans.cluster_centers_)
centers_df = pd.DataFrame(cluster_centers, 
                         columns=cluster_features,
                         index=list(profile_map.values()))

sns.heatmap(centers_df.T, annot=True, cmap='RdYlBu_r', center=0, 
            fmt='.2f', cbar_kws={'label': 'Feature Value'})
plt.title('Cluster Centers by Feature', fontsize=14, fontweight='bold')
plt.xlabel('Country Profile')
plt.ylabel('Features')

# 3. Profile Distribution
ax3 = plt.subplot(2, 3, 3)
profile_counts = df['Profile_Label'].value_counts()
colors_pie = [colors[list(profile_map.values()).index(label)] for label in profile_counts.index]
plt.pie(profile_counts.values, labels=profile_counts.index, autopct='%1.1f%%',
        colors=colors_pie, startangle=90)
plt.title('Distribution of Country Profiles', fontsize=14, fontweight='bold')

# 4. Vulnerability vs Investment Scatter
ax4 = plt.subplot(2, 3, 4)
for i, (profile, color) in enumerate(zip(profile_map.values(), colors)):
    mask = df['Profile_Label'] == profile
    plt.scatter(df[mask]['composite_vulnerability'], 
               df[mask]['USD_Commitment_sum'], 
               c=color, label=profile, alpha=0.7, s=50)

plt.xlabel('Composite Vulnerability')
plt.ylabel('USD Commitment (log scale)')
plt.yscale('log')
plt.title('Vulnerability vs Investment by Profile', fontsize=14, fontweight='bold')
plt.legend()
plt.grid(True, alpha=0.3)

# 5. Gender-Climate Synergy by Profile
ax5 = plt.subplot(2, 3, 5)
sns.boxplot(data=df, x='Profile_Label', y='Gender_Climate_Synergy', 
            palette=colors)
plt.xticks(rotation=45, ha='right')
plt.title('Gender-Climate Synergy by Profile', fontsize=14, fontweight='bold')
plt.ylabel('Gender-Climate Synergy Score')

# 6. Commitment Efficiency Analysis
ax6 = plt.subplot(2, 3, 6)
efficiency_by_profile = df.groupby('Profile_Label')['Commitment_Efficiency'].mean().sort_values(ascending=True)
bars = plt.barh(range(len(efficiency_by_profile)), efficiency_by_profile.values, 
                color=[colors[list(profile_map.values()).index(label)] for label in efficiency_by_profile.index])
plt.yticks(range(len(efficiency_by_profile)), efficiency_by_profile.index)
plt.xlabel('Average Commitment Efficiency')
plt.title('Aid Efficiency by Country Profile', fontsize=14, fontweight='bold')
plt.grid(True, alpha=0.3, axis='x')

# Add value labels on bars
for i, v in enumerate(efficiency_by_profile.values):
    plt.text(v + 0.01, i, f'{v:.2f}', va='center', fontweight='bold')

plt.tight_layout()
plt.savefig('country_clustering_analysis.png', dpi=300, bbox_inches='tight')
plt.show()

# Print cluster summary statistics
print("=" * 60)
print("CLUSTER ANALYSIS SUMMARY")
print("=" * 60)

for profile in profile_map.values():
    mask = df['Profile_Label'] == profile
    subset = df[mask]
    print(f"\n🎯 {profile.upper()}")
    print(f"   Count: {len(subset)} countries")
    print(f"   Avg Vulnerability: {subset['composite_vulnerability'].mean():.3f}")
    print(f"   Avg Investment: ${subset['USD_Commitment_sum'].mean()/1e6:.1f}M")
    print(f"   Avg Synergy: {subset['Gender_Climate_Synergy'].mean():.3f}")
    print(f"   Avg Efficiency: {subset['Commitment_Efficiency'].mean():.3f}")
    
    # Top countries in each cluster
    top_countries = subset.nlargest(3, 'USD_Commitment_sum')['country_name_verified'].tolist()
    print(f"   Top Recipients: {', '.join(top_countries[:3])}")

print(f"\n📊 Clustering completed and saved as 'country_clustering_analysis.png'")
print(f"📈 Total countries analyzed: {len(df)}")
print(f"🎯 Silhouette score: {kmeans.inertia_:.2f}")