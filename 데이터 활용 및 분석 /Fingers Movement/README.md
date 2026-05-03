# Finger Movement Classification with Explainable AI Analysis

## 1. Overview
This project develops a machine learning model to classify finger movement intention (left vs. right hand). Explainable AI (XAI) techniques are applied to interpret model decisions and identify important temporal and feature patterns.

## 2. Objective
- Classify finger movement from EEG signals  
- Analyze temporal patterns in time-series data  
- Identify key features influencing predictions  
- Improve model transparency using XAI  

## 3. Dataset
- Type: Multivariate EEG time-series  
- Shape: (50 time steps, 28 channels)  
- Samples: 316 (train), 100 (test)  
- Task: Binary classification (0 = Left, 1 = Right)  

## 4. Data Processing
- Converted `.ts` files to NumPy format `(samples, time, channels)`  
- Encoded labels using `LabelEncoder`  
- Normalized features using training statistics  
- Applied class balancing  

## 5. Model
- Model: LSTM (64 units)  
- Regularization: Dropout + L2  
- Optimizer: Adam (lr = 0.001)  
- Loss: Binary Crossentropy  
- Early stopping applied  

## 6. Results
- Accuracy: 0.61  
- ROC-AUC: 0.609  

| Class | Precision | Recall | F1 |
|------|----------|--------|----|
| Left | 0.61 | 0.57 | 0.59 |
| Right | 0.61 | 0.65 | 0.63 |

## 7. XAI Analysis
- **SHAP:** Key features concentrated in late time steps (t48–t50)  
- **Integrated Gradients:** Feature importance increases after t20–t30  
- **Saliency Maps:** Highest sensitivity in t39–t50 window  

## 8. Key Findings
- Late-stage EEG signals are most informative  
- Only selected channels significantly influence predictions  
- XAI methods provide consistent and interpretable results  

## 9. Reproducibility
- Public dataset download via `gdown`  
- Fixed random seed  
- Complete preprocessing and training pipeline  
- End-to-end executable notebook  

## 10. How to Run
Open the notebook in your preferred environment (e.g., Google Colab, Jupyter Notebook, or Visual Studio Code) and execute all cells sequentially.  
All required steps including data download, preprocessing, model training, evaluation, and XAI analysis are included within the notebook.

## 11. Tech Stack
Python, TensorFlow/Keras, scikit-learn, sktime, SHAP, NumPy, Pandas
