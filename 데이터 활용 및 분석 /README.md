# 데이터 활용 및 분석: 머신러닝 라이브러리를 이용한 재현 가능한 개발 결과물 공개 여부

## Overview
This repository presents a collection of machine learning projects demonstrating data utilization, analysis, and reproducible development practices. Each project applies established machine learning libraries to real-world datasets, with a focus on transparency, interpretability, and end-to-end reproducibility.

## Objective
- Apply machine learning techniques to diverse datasets  
- Develop reproducible pipelines for data processing, modeling, and evaluation  
- Provide interpretable insights using Explainable AI (XAI) methods  
- Ensure all results can be replicated through shared code and structured workflows  

## Project List
The repository includes the following projects:

### [Fingers Movement](./Fingers%20Movement)
- EEG-based time-series classification using LSTM  
- Explainable AI (XAI) analysis for temporal feature importance  
- Reproducible pipeline for preprocessing, training, and evaluation  

### [Turning Complaints into Insights](./Turning%20Complaints%20to%20Insights)
- NLP-based feature extraction using TF-IDF and sentiment analysis  
- Machine learning models for dispute prediction  
- Explainable AI (SHAP) for model interpretability  

### [Wafer Analysis](./Wafer%20Analysis)
- CNN-based classification of semiconductor wafer signals  
- Time-series modeling with feature preprocessing  
- XAI techniques for interpreting model behavior  

### [Injection Molding Defect Classification](./Injection%20Molding%20Defect%20Classification)
- Machine learning pipeline for defect detection using process data  
- Statistical labeling using SPC-based pseudo-labeling (±2σ rule) :contentReference[oaicite:0]{index=0}  
- Model comparison across Logistic Regression, KNN, Decision Tree, Random Forest, and XGBoost  
- Feature engineering and imbalance handling (oversampling)  
- Model evaluation using F1-score and AUC for imbalanced classification  

## Reproducibility
All projects are designed to support reproducibility through:

- Use of standard ML/DL libraries (e.g., scikit-learn, TensorFlow, XGBoost)  
- Clear data preprocessing and feature engineering steps  
- Defined model architectures and training configurations  
- Fixed random seeds where applicable  
- End-to-end executable notebooks  
- Documented workflows in project-level README files  

Each sub-project can be executed independently and includes the necessary steps for data loading, model training, evaluation, and analysis.

## Tech Stack
Python, scikit-learn, TensorFlow/Keras, XGBoost, SHAP, NumPy, Pandas
