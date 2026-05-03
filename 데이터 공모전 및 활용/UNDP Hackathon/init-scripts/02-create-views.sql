-- ===============================
-- Fast aggregates via MVs
-- ===============================
DROP VIEW IF EXISTS sector_donor_analytics CASCADE;
DROP VIEW IF EXISTS sector_analytics CASCADE;
DROP VIEW IF EXISTS donors_analytics CASCADE;
DROP VIEW IF EXISTS donors_year_analytics CASCADE;
DROP VIEW IF EXISTS projects_tagged CASCADE;
DROP VIEW IF EXISTS donor_region_tagged CASCADE;
DROP VIEW IF EXISTS region_tagged_analytics CASCADE;
DROP VIEW IF EXISTS donor_region_year_analytics CASCADE;
DROP VIEW IF EXISTS recipient_tagged_analytics CASCADE;
DROP VIEW IF EXISTS data_insights_overview CASCADE;

DROP MATERIALIZED VIEW IF EXISTS sector_donor_analytics_mv CASCADE;
DROP MATERIALIZED VIEW IF EXISTS sector_analytics_mv CASCADE;
DROP MATERIALIZED VIEW IF EXISTS donors_analytics_mv CASCADE;
DROP MATERIALIZED VIEW IF EXISTS donors_year_analytics_mv CASCADE;
DROP MATERIALIZED VIEW IF EXISTS donor_region_tagged_mv CASCADE;
DROP MATERIALIZED VIEW IF EXISTS region_tagged_analytics_mv CASCADE;
DROP MATERIALIZED VIEW IF EXISTS donor_region_year_tagged_mv CASCADE;
DROP MATERIALIZED VIEW IF EXISTS recipient_tagged_analytics_mv CASCADE;
DROP MATERIALIZED VIEW IF EXISTS insights_overview_mv CASCADE;


-- ------------------------------------
-- 1) Base tagged projects (index-friendly)
--    Keep raw donor_name/sector_name (no COALESCE here).
--    If table already has a correct `bucket` column, just use it.
--    If not, replace "p.bucket" below with the CASE you used before.
-- ------------------------------------
CREATE VIEW projects_tagged AS
SELECT
    p.id,
    p.project_number,
    p.region_name,
    p.year,
    p.donor_name,
    p.recipient_name,
    p.sector_name,
    p.usd_disbursement,
    p.usd_commitment_imputed,
    p.gender,
    p.climate_mitigation,
    p.climate_adaptation,
    CASE WHEN COALESCE(gender, 0) >= 1 AND (COALESCE(climate_mitigation, 0) >= 1 OR COALESCE(climate_adaptation, 0) >= 1) THEN 'Integrated' WHEN COALESCE(gender, 0) >= 1 THEN 'Gender Only' WHEN (COALESCE(climate_mitigation, 0) >= 1 OR COALESCE(climate_adaptation, 0) >= 1) THEN 'Climate Only' ELSE 'Neither' END AS bucket
FROM projects AS p;

-- ------------------------------------
-- 2) Donor analytics (year-agnostic) → MV
--    Counts each row as a project (same behavior as your previous view).
--    If you later want dedup across years by project_number, see commented COUNT(DISTINCT ...) alt.
-- ------------------------------------
CREATE MATERIALIZED VIEW donors_analytics_mv AS
WITH donor_base AS (
    SELECT
        donor_name,
        COUNT(*)                                        AS project_count,
        COUNT(DISTINCT COALESCE(NULLIF(region_name, ''), 'Unspecified')) AS regions_covered,
        (COALESCE(SUM(usd_disbursement), 0)) * 1000000       AS total_disbursement,
        (COALESCE(SUM(usd_commitment_imputed), 0)) * 1000000 AS total_commitment,
        SUM((bucket = 'Integrated')::int)               AS integrated_projects,
        SUM((bucket = 'Gender Only')::int)              AS gender_projects,
        SUM((bucket = 'Climate Only')::int)             AS climate_projects,
        SUM((bucket = 'Neither')::int)                  AS general_projects,
        (COALESCE(SUM(usd_disbursement) FILTER (WHERE bucket = 'Integrated'), 0)) * 1000000   AS disb_integrated_usd,
        (COALESCE(SUM(usd_disbursement) FILTER (WHERE bucket = 'Gender Only'), 0)) * 1000000  AS disb_gender_usd,
        (COALESCE(SUM(usd_disbursement) FILTER (WHERE bucket = 'Climate Only'), 0)) * 1000000 AS disb_climate_usd
    FROM projects_tagged
    WHERE donor_name IS NOT NULL AND donor_name <> ''
    GROUP BY donor_name
)
SELECT
    donor_name,
    project_count,
    regions_covered,
    total_disbursement,
    total_commitment,
    integrated_projects,
    gender_projects,
    climate_projects,
    general_projects,
    ROUND(CASE WHEN project_count > 0 THEN integrated_projects::numeric / project_count * 100 ELSE 0 END, 1) AS integrated_pct,
    ROUND(CASE WHEN project_count > 0 THEN gender_projects   ::numeric / project_count * 100 ELSE 0 END, 1) AS gender_only_pct,
    ROUND(CASE WHEN project_count > 0 THEN climate_projects  ::numeric / project_count * 100 ELSE 0 END, 1) AS climate_only_pct,
    ROUND(CASE WHEN project_count > 0 THEN general_projects  ::numeric / project_count * 100 ELSE 0 END, 1) AS neither_pct,
    CASE
        WHEN climate_projects   > 0 AND gender_projects > 0 AND integrated_projects > 0 THEN 'Natural Integrators'
        WHEN climate_projects   > 0 AND gender_projects = 0 THEN 'Climate Specialists'
        WHEN gender_projects    > 0 AND climate_projects = 0 THEN 'Gender Specialists'
        WHEN climate_projects   > 0 AND gender_projects > 0 AND integrated_projects = 0 THEN 'Sequential Builders'
        ELSE 'General Development'
    END AS archetype,
    disb_integrated_usd,
    disb_gender_usd,
    disb_climate_usd,
    (disb_integrated_usd + disb_gender_usd + disb_climate_usd) AS total_disb_usd_tagged
FROM donor_base;

-- Unique index → enables REFRESH CONCURRENTLY
CREATE UNIQUE INDEX donors_analytics_mv_uq ON donors_analytics_mv(donor_name);

-- ------------------------------------
-- 3) Donor × Year analytics → MV (useful if you filter by years in APIs)
-- ------------------------------------
CREATE MATERIALIZED VIEW public.donors_year_analytics_mv AS
SELECT
    donor_name,
    year,
    COUNT(*)                                             AS project_count,
    COALESCE(SUM(usd_disbursement), 0) * 1000000            AS total_disbursement,
    COALESCE(SUM(usd_commitment_imputed), 0) * 1000000      AS total_commitment,
    SUM((bucket = 'Integrated')::int)                    AS integrated_projects,
    SUM((bucket = 'Gender Only')::int)                   AS gender_projects,
    SUM((bucket = 'Climate Only')::int)                  AS climate_projects,
    SUM((bucket = 'Neither')::int)                       AS general_projects,
    COALESCE(SUM(usd_disbursement) FILTER (WHERE bucket = 'Integrated'), 0) * 1000000   AS disb_integrated_usd,
    COALESCE(SUM(usd_disbursement) FILTER (WHERE bucket = 'Gender Only'), 0) * 1000000  AS disb_gender_usd,
    COALESCE(SUM(usd_disbursement) FILTER (WHERE bucket = 'Climate Only'), 0) * 1000000 AS disb_climate_usd,
    COALESCE(SUM(usd_disbursement) FILTER (WHERE bucket IN ('Integrated','Gender Only','Climate Only')), 0) * 1000000
      AS total_disb_usd_tagged
FROM public.projects_tagged
WHERE donor_name IS NOT NULL AND donor_name <> ''
GROUP BY donor_name, year;

CREATE UNIQUE INDEX IF NOT EXISTS donors_year_analytics_mv_uq
  ON public.donors_year_analytics_mv(donor_name, year);

CREATE INDEX IF NOT EXISTS donors_year_analytics_mv_year
  ON public.donors_year_analytics_mv(year);

-- ------------------------------------
-- 4) Sector analytics (Sector × Year) → MV
-- ------------------------------------
CREATE MATERIALIZED VIEW sector_analytics_mv AS
SELECT
    COALESCE(sector_name, 'Unspecified') AS sector_name,
    year,
    COUNT(*)                              AS project_count,
    (COALESCE(SUM(usd_disbursement), 0))*1000000       AS total_disb_usd,
    (COALESCE(SUM(usd_commitment_imputed), 0))*1000000 AS total_commit_usd,
    SUM((bucket = 'Integrated')::int)        AS integrated_count,
    SUM((bucket = 'Gender Only')::int)       AS gender_only_count,
    SUM((bucket = 'Climate Only')::int)      AS climate_only_count,
    SUM((bucket = 'Neither')::int)           AS neither_count
FROM projects_tagged
GROUP BY 1, 2;

CREATE UNIQUE INDEX sector_analytics_mv_uq ON sector_analytics_mv(sector_name, year);

-- ------------------------------------
-- 5) Sector × Donor × Year → MV
-- ------------------------------------
CREATE MATERIALIZED VIEW sector_donor_analytics_mv AS
SELECT
    COALESCE(sector_name, 'Unspecified') AS sector_name,
    COALESCE(donor_name,  'Unspecified') AS donor_name,
    year,
    COUNT(*)                              AS proj_count,
    (COALESCE(SUM(usd_disbursement), 0))*1000000       AS donor_disb_usd,
    (COALESCE(SUM(usd_commitment_imputed), 0))*1000000 AS donor_commit_usd,
    SUM((bucket = 'Integrated')::int)        AS integrated_count,
    SUM((bucket = 'Gender Only')::int)       AS gender_only_count,
    SUM((bucket = 'Climate Only')::int)      AS climate_only_count
FROM projects_tagged
GROUP BY 1, 2, 3;

CREATE UNIQUE INDEX sector_donor_analytics_mv_uq
  ON sector_donor_analytics_mv(sector_name, donor_name, year);

-- ------------------------------------
-- 6) donor × region → MV
-- ------------------------------------
CREATE MATERIALIZED VIEW donor_region_tagged_mv AS
SELECT
    p.donor_name,
    COALESCE(NULLIF(p.region_name, ''), 'Unspecified') AS region_name,
    COUNT(*)                                                    AS proj_count_tagged,
    (COALESCE(SUM(p.usd_disbursement), 0)) * 1000000               AS total_disb_usd_tagged,
    (COALESCE(SUM(p.usd_commitment_imputed), 0)) * 1000000         AS total_commit_usd_tagged,
    SUM((p.bucket = 'Integrated')::int)                         AS integrated_count,
    SUM((p.bucket = 'Gender Only')::int)                        AS gender_only_count,
    SUM((p.bucket = 'Climate Only')::int)                       AS climate_only_count
FROM projects_tagged p
WHERE p.bucket IN ('Integrated','Gender Only','Climate Only')
  AND p.donor_name IS NOT NULL AND p.donor_name <> ''
GROUP BY 1, 2;

CREATE UNIQUE INDEX donor_region_tagged_mv_uq
  ON donor_region_tagged_mv(donor_name, region_name);

-- ------------------------------------
-- 7) region → MV
-- ------------------------------------
CREATE MATERIALIZED VIEW region_tagged_analytics_mv AS
SELECT
    COALESCE(NULLIF(p.region_name, ''), 'Unspecified') AS region_name,
    COUNT(*)                                            AS proj_count_tagged,
    (COALESCE(SUM(p.usd_disbursement), 0)) * 1000000       AS total_disb_usd_tagged,
    (COALESCE(SUM(p.usd_commitment_imputed), 0)) * 1000000 AS total_commit_usd_tagged
FROM projects_tagged p
WHERE p.bucket IN ('Integrated','Gender Only','Climate Only')
GROUP BY 1;

CREATE UNIQUE INDEX region_tagged_analytics_mv_uq
  ON region_tagged_analytics_mv(region_name);

-- ------------------------------------
-- 8) donor-region-year → MV
-- ------------------------------------
CREATE MATERIALIZED VIEW donor_region_year_tagged_mv AS
SELECT
    p.donor_name,
    COALESCE(NULLIF(p.region_name, ''), 'Unspecified') AS region_name,
    p.year,
    COUNT(*)                                            AS proj_count_tagged,
    (COALESCE(SUM(p.usd_disbursement), 0)) * 1000000       AS total_disb_usd_tagged,
    (COALESCE(SUM(p.usd_commitment_imputed), 0)) * 1000000 AS total_commit_usd_tagged,
    SUM((p.bucket = 'Integrated')::int)                 AS integrated_count,
    SUM((p.bucket = 'Gender Only')::int)                AS gender_only_count,
    SUM((p.bucket = 'Climate Only')::int)               AS climate_only_count
FROM projects_tagged p
WHERE p.bucket IN ('Integrated','Gender Only','Climate Only')
  AND p.donor_name IS NOT NULL AND p.donor_name <> ''
GROUP BY 1, 2, 3;

CREATE UNIQUE INDEX donor_region_year_tagged_mv_uq
  ON donor_region_year_tagged_mv(donor_name, region_name, year);


-- ------------------------------------
-- 9) recepient analytics → MV
-- ------------------------------------

CREATE MATERIALIZED VIEW recipient_tagged_analytics_mv AS
SELECT
  COALESCE(NULLIF(p.recipient_name, ''), 'Unspecified') AS recipient_name,
  COUNT(*)                                            AS project_count_tagged,
  SUM((p.bucket = 'Integrated')::int)                 AS integrated_count
FROM projects_tagged p
WHERE p.bucket IN ('Integrated','Gender Only','Climate Only')
GROUP BY 1;

CREATE UNIQUE INDEX recipient_tagged_analytics_mv_uq
  ON recipient_tagged_analytics_mv(recipient_name);


 -------------------------------------
-- 10) Insights Overview → MV
-- ------------------------------------
CREATE MATERIALIZED VIEW insights_overview_mv AS
WITH t AS (
  SELECT donor_name, recipient_name, usd_disbursement, bucket
  FROM projects_tagged
),
counts AS (
  SELECT
    COUNT(*)::bigint                                                   AS tagged_projects,
    COUNT(*) FILTER (WHERE bucket = 'Integrated')::bigint             AS integrated_projects,
    COUNT(*) FILTER (WHERE bucket IN ('Integrated','Gender Only'))    AS gender_projects,
    COUNT(*) FILTER (WHERE bucket IN ('Integrated','Climate Only'))   AS climate_projects,
    COUNT(DISTINCT donor_name)::int                                   AS active_donors,
    COUNT(DISTINCT recipient_name)::int                               AS covered_countries,
    (COALESCE(SUM(usd_disbursement), 0)) * 1000000                        AS total_disbursed_funding_usd
  FROM t
)
SELECT
  total_disbursed_funding_usd,
  tagged_projects,
  active_donors,
  covered_countries,
  /* % integrated among the tagged universe */
  CASE WHEN tagged_projects > 0
       THEN ROUND(100.0 * integrated_projects / tagged_projects, 1)
       ELSE 0 END                                AS integration_rate_pct,
  /* “Coverage” = % of tagged projects that include each marker */
  CASE WHEN tagged_projects > 0
       THEN ROUND(100.0 * gender_projects / tagged_projects, 1)
       ELSE 0 END                                AS gender_coverage_pct,
  CASE WHEN tagged_projects > 0
       THEN ROUND(100.0 * climate_projects / tagged_projects, 1)
       ELSE 0 END                                AS climate_coverage_pct,
  /* For this dashboard we use the tagged universe as 'total' */
  covered_countries                              AS total_countries
FROM counts;

-- Single-row MV needs a UNIQUE index for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS insights_overview_mv_uniq
  ON insights_overview_mv ((TRUE));


-- ------------------------------------
-- Wrapper VIEWS to keep your original names stable
--    (Thin selects over the MVs)
-- ------------------------------------

-- Donors (year-agnostic)
CREATE VIEW donors_analytics AS
SELECT
    donor_name,
    project_count,
    regions_covered,
    total_disbursement,
    total_commitment,
    integrated_projects,
    gender_projects,
    climate_projects,
    general_projects,
    integrated_pct,
    gender_only_pct,
    climate_only_pct,
    neither_pct,
    archetype,
    total_disb_usd_tagged,
    disb_integrated_usd,
    disb_gender_usd,
    disb_climate_usd
FROM donors_analytics_mv;

-- Sectors (Sector × Year)
CREATE VIEW sector_analytics AS
SELECT
    sector_name,
    year,
    project_count,
    total_disb_usd,
    total_commit_usd,
    integrated_count,
    gender_only_count,
    climate_only_count,
    neither_count
FROM sector_analytics_mv;

-- Sector × Donor × Year
CREATE VIEW sector_donor_analytics AS
SELECT
    sector_name,
    donor_name,
    year,
    proj_count,
    donor_disb_usd,
    donor_commit_usd,
    integrated_count,
    gender_only_count,
    climate_only_count
FROM sector_donor_analytics_mv;

CREATE VIEW donor_region_tagged AS
SELECT * FROM donor_region_tagged_mv;

CREATE VIEW donors_year_analytics AS
SELECT * FROM donors_year_analytics_mv;

CREATE VIEW region_tagged_analytics AS
SELECT * FROM region_tagged_analytics_mv;

CREATE VIEW donor_region_year_analytics AS
SELECT * FROM donor_region_year_tagged_mv;


CREATE VIEW recipient_tagged_analytics AS
SELECT * FROM recipient_tagged_analytics_mv;

CREATE VIEW data_insights_overview AS
SELECT
  total_disbursed_funding_usd,
  tagged_projects        AS total_projects,
  active_donors,
  integration_rate_pct,
  covered_countries,
  total_countries,
  gender_coverage_pct,
  climate_coverage_pct
FROM insights_overview_mv;


-- ------------------------------------
-- 7) (Optional) Refresh commands — run after data loads/ingestion.
REFRESH MATERIALIZED VIEW CONCURRENTLY donors_analytics_mv;
REFRESH MATERIALIZED VIEW CONCURRENTLY donors_year_analytics_mv;
REFRESH MATERIALIZED VIEW CONCURRENTLY sector_analytics_mv;
REFRESH MATERIALIZED VIEW CONCURRENTLY sector_donor_analytics_mv;
REFRESH MATERIALIZED VIEW CONCURRENTLY donor_region_tagged_mv;
REFRESH MATERIALIZED VIEW CONCURRENTLY region_tagged_analytics_mv;
REFRESH MATERIALIZED VIEW CONCURRENTLY donor_region_year_tagged_mv;
REFRESH MATERIALIZED VIEW CONCURRENTLY recipient_tagged_analytics_mv;
REFRESH MATERIALIZED VIEW public.insights_overview_mv;
