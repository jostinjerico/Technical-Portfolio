# Manufacturing Process Analytics: EDA and Defect Detection in Injection Molding

## 1. Overview
This project presents an exploratory data analysis (EDA) and data preparation pipeline for injection molding process data. It focuses on identifying defect patterns and understanding the relationship between process parameters and product quality using statistical and machine learning-oriented techniques.

## 2. Objective
- Analyze manufacturing process data to detect defects  
- Identify key process parameters influencing product quality  
- Apply statistical methods for anomaly detection  
- Develop a structured and reproducible data preprocessing pipeline  

## 3. Dataset
- Source: KAMP Injection Molding Predictive Maintenance Data  
- Type: Multivariate time-series process data  
- Features: Machine parameters (temperature, pressure, cycle time, etc.)  
- Target: Product quality (Normal vs Outlier)  

The dataset includes sensor readings and operational variables collected during injection molding cycles

## 4. Data Processing
- Removed low-sample product groups for statistical reliability  
- Labeled defects using statistical thresholding (mean ± 2σ)  
- Identified and removed low-variability and MNAR features  
- Applied feature transformations:
  - Standardization (cycle time)
  - Log transformation (pressure variables)
  - Robust scaling (outlier-sensitive features)
  - Power transformation (temperature)
- Performed categorical encoding (shift, pressure levels, product codes)

## 5. Analysis
- Product-wise defect distribution analysis  
- Comparison of normal vs defective samples  
- Feature impact analysis:
  - CV (cycle variables): key drivers of defects  
  - SV (sensor variables): generally stable, minimal impact  
- Time-series trend analysis for process stability  

Results indicate that defects are primarily associated with process dynamics rather than fixed machine settings.

## 6. How to Run
Open the notebook in your preferred environment (Google Colab, Jupyter Notebook, or Visual Studio Code) and run all cells sequentially.

## 7. Tech Stack
Python, Pandas, NumPy, scikit-learn, Matplotlib, Seaborn
