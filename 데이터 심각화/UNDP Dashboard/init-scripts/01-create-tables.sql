CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For fuzzy text search

-- Main projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    project_number TEXT,
    year INTEGER,
    donor_name TEXT,
    recipient_name TEXT,
    region_name TEXT,
    sector_name TEXT,
    usd_commitment_imputed NUMERIC(15, 6),
    usd_disbursement NUMERIC(15, 6),
    project_title TEXT,
    long_description TEXT,
    gender INTEGER,
    climate_mitigation INTEGER,
    climate_adaptation INTEGER,

    -- Derived fields (for performance)
    bucket TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN gender >= 1 AND (climate_mitigation >= 1 OR climate_adaptation >= 1) THEN 'Integrated'
            WHEN gender >= 1 THEN 'Gender Only'
            WHEN climate_mitigation >= 1 OR climate_adaptation >= 1 THEN 'Climate Only'
            ELSE 'Neither'
        END
    ) STORED,
    
    -- Full-text search vector
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(project_title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(long_description, '')), 'B')
    ) STORED
);

-- Indexes for performance
CREATE INDEX idx_projects_year ON projects (year);
CREATE INDEX idx_projects_donor ON projects (donor_name);
CREATE INDEX idx_projects_recipient ON projects (recipient_name);
CREATE INDEX idx_projects_sector ON projects (sector_name);
CREATE INDEX idx_projects_bucket ON projects (bucket);
CREATE INDEX idx_projects_search ON projects USING GIN (search_vector);
CREATE INDEX idx_projects_disbursement ON projects (usd_disbursement);
CREATE INDEX idx_projects_commitment ON projects (usd_commitment_imputed);