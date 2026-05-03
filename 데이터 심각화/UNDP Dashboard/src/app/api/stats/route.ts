import { query } from '@/lib/db/client';

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        COUNT(DISTINCT "year") as years,
        COUNT(DISTINCT "recipient_name") as countries,
        COUNT(DISTINCT "donor_name") as donors,
        COUNT(*) as projects
      FROM projects
    `);
    
    const stats = result.rows[0];
    return Response.json({
      years: stats.years,
      countries: `${stats.countries}+`,
      donors: `${stats.donors}+`,
      projects: `${Math.round(stats.projects / 1000)}K+`
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return Response.json({ 
      years: "10", 
      countries: "150+", 
      donors: "115+", 
      projects: "570K+" 
    });
  }
}