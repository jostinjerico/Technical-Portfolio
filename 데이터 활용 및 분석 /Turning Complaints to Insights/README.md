# Turning Complaints into Insights: An Explainable AI Approach

## 1. Overview
This project develops a reproducible machine learning pipeline to analyze financial customer complaints and predict dispute outcomes. It integrates NLP, machine learning, and Explainable AI (XAI) to provide interpretable insights.

## 2. Objective
- Predict dispute escalation from complaint data  
- Extract insights from complaint narratives  
- Ensure transparent and reproducible modeling  

## 3. Dataset
- Source: CFPB Consumer Complaint Database  
- Size: ~50,000 complaints
- Features: complaint text, product, company metadata  
- Target: Dispute Flag (binary)  

## 4. Data Processing
- Missing values handled using placeholder categories  
- TF-IDF applied to complaint text  
- Sentiment scores extracted (VADER)  
- Categorical encoding via OneHotEncoder  
- Class imbalance handled using upsampling  
- Time-based train-test split (80/20) :contentReference[oaicite:1]{index=1}  


## 5. Models
- Logistic Regression  
- Random Forest  
- XGBoost  

Pipeline includes preprocessing + model training with time-series cross-validation.

## 6. Explainable AI (XAI)
- SHAP used for feature-level interpretability  
- Identifies key drivers of dispute such as:
  - Credit reporting issues  
  - Loan servicing problems  
  - Complaint-specific keywords  

## 7. Topic Analysis
- LDA and BERTopic used for theme extraction  
- Reveals dominant complaint categories and patterns 

## 8. Results 
- Models demonstrate moderate predictive performance  
- Dispute prediction is influenced more by complaint content than sentiment  
- XAI confirms consistent feature importance across models 

## 9. Reproducibility
- Fixed random seeds  
- Defined preprocessing and feature engineering pipeline  
- Explicit model configurations  
- Time-aware data splitting  
- Cross-validation for stability  

## 10. How to Run
Open the notebook in your preferred environment (Colab, Jupyter, VS Code) and run all cells sequentially. Use complaints_50k.csv for the dataset used in the experiments.

## 11. Tech Stack
Python, scikit-learn, XGBoost, SHAP, NLP (TF-IDF, VADER), BERTopic
