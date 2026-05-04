# Manufacturing Chatbot using AI Agents: Data Structuring and Processing

## Overview
This project presents a data structuring and processing pipeline for a manufacturing chatbot prototype. It focuses on transforming domain-specific knowledge into machine-readable formats to support retrieval-based reasoning using AI agents.

## Objective
- Structure and organize manufacturing domain data  
- Standardize data representation for AI-based reasoning  
- Enable efficient retrieval through vector-based indexing  
- Ensure data usability and reproducibility  

## Dataset
The dataset consists of structured JSON-based context cards:

- Ruleset (classification rules for defect prediction)  
- Model (rule structure and logic)  
- Profile (user roles and expertise levels)  
- Domain/Data descriptions  

## Data Processing
- Structured domain knowledge into standardized JSON schemas  
- Transformed structured data into text representations for embedding  
- Indexed data into a vector database (ChromaDB)  
- Generated semantic embeddings for retrieval  

Context elements are stored with metadata for both granular and full-context access  

## Data Utilization
- Integrated into a Retrieval-Augmented Generation (RAG) pipeline  
- Enables context-aware query answering  
- Adapts responses based on user roles (Operator, Manager, Data Scientist)  

## Reproducibility
- Explicit JSON schema and structured dataset  
- Defined data transformation and indexing pipeline  
- Standardized embedding and retrieval process  
- End-to-end executable notebook  

## How to Run
Open the notebook in your preferred environment (Google Colab, Jupyter Notebook, or Visual Studio Code) and execute all cells sequentially.

## Tech Stack
Python, JSON, ChromaDB, SentenceTransformers, OpenAI API
