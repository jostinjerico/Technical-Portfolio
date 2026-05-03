# Manufacturing Chatbot using AI Agents: Data Collection and Structuring

## Overview
This project presents a structured data collection and processing pipeline for a manufacturing chatbot prototype. It focuses on transforming domain-specific knowledge into machine-readable formats to support retrieval-based reasoning using AI agents.

## Objective
- Collect and structure manufacturing domain data  
- Standardize data representation for AI-based reasoning  
- Enable efficient retrieval through vector-based indexing  
- Ensure data usability and reproducibility  

## Dataset
The dataset consists of structured JSON-based context cards:

- Ruleset (classification rules for defect prediction)  
- Model (rule structure and logic)  
- Profile (user roles and expertise levels)  
- Domain/Data descriptions  

Example: Rule-based dataset with defined thresholds and classification outputs 

## Data Processing
- Structured domain knowledge into standardized JSON schema  
- Converted data into text for embedding  
- Indexed into vector database (ChromaDB)  
- Applied semantic embeddings for retrieval  

Context elements are stored with metadata for granular and full-level access 

## Data Utilization
- Integrated into a Retrieval-Augmented Generation (RAG) pipeline  
- Supports context-aware query answering  
- Adapts responses based on user roles (Operator, Manager, Data Scientist)

## Reproducibility
- Explicit JSON dataset and schema  
- Defined data loading and indexing pipeline  
- Standard embedding and retrieval process  
- End-to-end executable notebook  

## How to Run
Open the notebook in your preferred environment (Colab, Jupyter, or VS Code) and execute all cells sequentially.

## Tech Stack
Python, JSON, ChromaDB, SentenceTransformers, OpenAI API, Agno
