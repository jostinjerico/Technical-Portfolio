# Pitaka: Fraud Detection System (Proof-of-Concept)

## Overview
Pitaka is a proof-of-concept system for enhancing digital wallet security. It explores the integration of anomaly detection, authentication mechanisms, and transaction logging within a unified framework.

## Objective
- Explore anomaly detection on transaction data  
- Implement basic data processing for fraud identification  
- Integrate security components such as authentication and logging  
- Demonstrate a simple end-to-end system pipeline  

## System Components
- Anomaly detection using Isolation Forest  
- Multi-factor authentication (OTP-based)  
- Transaction logging for traceability  

## Data Processing
- Processed transaction data using Python (Pandas)  
- Applied Isolation Forest to detect anomalous transaction patterns  
- Flagged potential anomalies based on model output  

## Limitations
- Proof-of-concept implementation (not production-ready)  
- Model performance not fully evaluated  
- Limited feature set (e.g., primarily transaction amount)  

## How to Run
Clone the repository and run the script in your preferred Python environment.  
The implementation demonstrates basic anomaly detection on sample transaction data.

## Tech Stack
Python, Pandas, scikit-learn
