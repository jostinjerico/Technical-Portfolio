# Wafer Fault Detection with Explainable AI

## 1. Overview
This project presents a reproducible machine learning pipeline for classifying semiconductor wafer signals into normal and abnormal categories using time-series data. The study integrates Explainable AI (XAI) methods to interpret model behavior while emphasizing reproducibility of the full workflow.

## 2. Objective
- Classify wafer signals as normal or abnormal  
- Develop a reproducible deep learning pipeline  
- Analyze model behavior using XAI techniques  

## 3. Dataset
- Type: Univariate time-series  
- Shape: (152 time steps, 1 feature)  
- Training Samples: ~1800  
- Test Samples: ~6000+  
- Task: Binary classification (Normal vs Abnormal)
  
Each sample represents a sensor signal collected during a wafer manufacturing process.

## 4. Data Processing
- Loaded `.arff` files into Pandas DataFrames  
- Converted labels to binary format (0/1)  
- Addressed class imbalance using upsampling  
- Standardized features using `StandardScaler`  

## 5. Model
A 1D Convolutional Neural Network (CNN) was implemented.

### Architecture
- Conv1D → BatchNorm → MaxPooling → Dropout  
- Stacked convolutional blocks  
- GlobalAveragePooling  
- Dense layers with sigmoid output  

### Training Setup
- Optimizer: Adam (lr = 0.001)  
- Loss: Binary Crossentropy  
- Batch size: 32  
- Early stopping and model checkpoint applied  
- Train/Validation split: 80/20  

## 6. Explainable AI (XAI)
- **SHAP:** Identifies globally important time steps  
- **Integrated Gradients:** Provides local and global attribution  
- **Saliency Maps:** Measures model sensitivity over time  

These methods help interpret which parts of the signal influence predictions.

## 7. Reproducibility
This project is designed for full reproducibility:

- Fixed random seed across NumPy, TensorFlow, and Python  
- Public dataset loading (`.arff` files)  
- Explicit preprocessing steps (scaling, reshaping, balancing)  
- Defined CNN architecture and training configuration  
- Model checkpoint saving (`.keras`)  
- Saved preprocessing object (`scaler.pkl`)  
- End-to-end notebook execution pipeline :contentReference[oaicite:4]{index=4}  

## 8. How to Run
Open the notebook in your preferred environment (e.g., Google Colab, Jupyter Notebook, or Visual Studio Code) and run all cells sequentially.

The notebook includes:
- Data loading and preprocessing  
- Model training and evaluation  
- XAI analysis and visualization  

## 9. Tech Stack
Python, TensorFlow/Keras, scikit-learn, SHAP, NumPy, Pandas, Matplotlib
