'use server';

import { query } from '@/lib/db/client';
import { Project } from '@/lib/db/schema';

export async function getProjects(filters: {
  donor?: string;
  country?: string;
  sector?: string;
  bucket?: string;
  yearFrom?: number;
  yearTo?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortField?: 'year' | 'usd_disbursement' | 'bucket';  // ADD THIS
  sortDirection?: 'asc' | 'desc';                       // ADD THIS
}) {
  const {
    donor,
    country,
    sector,
    bucket,
    yearFrom = 2014,
    yearTo = 2023,
    search,
    page = 1,
    limit = 20,
    sortField,      
    sortDirection = 'asc',  // ADD THIS
  } = filters;

  const offset = (page - 1) * limit;

  // Build dynamic WHERE clause
  const conditions: string[] = ['year BETWEEN $1 AND $2'];
  const params: any[] = [yearFrom, yearTo];
  let paramIndex = 3;

  if (donor) {
    conditions.push(`donor_name = $${paramIndex++}`);
    params.push(donor);
  }
  if (country) {
    conditions.push(`recipient_name = $${paramIndex++}`);
    params.push(country);
  }
  if (sector) {
    conditions.push(`sector_name = $${paramIndex++}`);
    params.push(sector);
  }
  if (bucket) {
    conditions.push(`bucket = $${paramIndex++}`);
    params.push(bucket);
  }
  if (search) {
    conditions.push(`search_vector @@ plainto_tsquery('english', $${paramIndex++})`);
    params.push(search);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // BUILD DYNAMIC ORDER BY CLAUSE - ADD THIS SECTION
  let orderByClause: string;
  if (sortField) {
    // Sanitize sortDirection to prevent SQL injection
    const direction = sortDirection.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    
    // Map bucket sorting to a custom order for logical grouping
    if (sortField === 'bucket') {
      // Sort buckets in a meaningful order: Integrated > Gender Only > Climate Only > Neither
      orderByClause = `
        ORDER BY 
          CASE bucket
            WHEN 'Integrated' THEN 1
            WHEN 'Gender Only' THEN 2
            WHEN 'Climate Only' THEN 3
            WHEN 'Neither' THEN 4
            ELSE 5
          END ${direction}
      `;
    } else {
      // For year and usd_disbursement, sort directly
      orderByClause = `ORDER BY ${sortField} ${direction}`;
    }
  } else {
    // Default sorting when no sort is specified
    orderByClause = 'ORDER BY year DESC, usd_disbursement DESC';
  }

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM projects 
    ${whereClause}
  `;
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Get projects - MODIFIED QUERY
  const projectsQuery = `
    SELECT * FROM projects
    ${whereClause}
    ${orderByClause}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  const projectsResult = await query(projectsQuery, [...params, limit, offset]);

  return {
    projects: projectsResult.rows as Project[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getFilterOptions() {
  const donors = await query(`
    SELECT donor_name, COUNT(*) as count 
    FROM projects 
    GROUP BY donor_name 
    ORDER BY count DESC
  `);

  const countries = await query(`
    SELECT recipient_name, COUNT(*) as count 
    FROM projects 
    GROUP BY recipient_name 
    ORDER BY count DESC
  `);

  const sectors = await query(`
    SELECT sector_name, COUNT(*) as count 
    FROM projects 
    GROUP BY sector_name 
    ORDER BY count DESC
  `);

  return {
    donors: donors.rows,
    countries: countries.rows,
    sectors: sectors.rows,
    buckets: ['Integrated', 'Gender Only', 'Climate Only', 'Neither'],
  };
}