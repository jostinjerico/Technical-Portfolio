# EcoEquity: UNDP Gender × Climate Data Dashboard

## 1. Overview
This project presents a reproducible data analytics pipeline and dashboard for analyzing gender–climate integration using Official Development Assistance (ODA) data. The system focuses on data processing, statistical analysis, and visualization of large-scale development datasets.

## 2. Objective
- Analyze gender–climate integration patterns in ODA data  
- Perform data-driven exploration and statistical analysis  
- Develop a reproducible data processing and visualization pipeline  

## 3. Dataset
- Source: OECD CRS dataset
- Type: Large-scale tabular dataset with text metadata  
- Scale: 700K+ development project records  

Features include:
- Funding values, donor/recipient information  
- Sector classifications  
- Gender and climate indicators  

## 4. Data Processing
- Data cleaning and missing value handling  
- Cross-dataset integration  
- Feature engineering for integration indicators  
- NLP-based processing of project descriptions  
- Structured transformation for analysis and visualization  

## 5. Analytical Approach
- Exploratory Data Analysis (EDA)  
- Regression and spillover analysis  
- Clustering and benchmarking  
- NLP-based scoring for integration signals  

## 6. Visualization
- Dashboard for aggregated funding patterns  
- Multi-level analysis (donor, sector, recipient)  
- Interactive filtering and project-level exploration  

## 7. Tech Stack
Python, Pandas, NumPy, NLP (TF-IDF), Visualization Libraries

## 8. Team & Contribution
This project is a collaborative work of the **EcoEquity Team**.

**Personal Contributions:**
- Data Analysis  
- Data Visualization  
- Project Management  
- Client Communication  
- Dashboard Design  

## 9. How to Run
Open the notebook or dashboard in your preferred environment (Colab, Jupyter, or local setup) and execute the workflow sequentially.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
