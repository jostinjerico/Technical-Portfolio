export type Project = {
  id: number;
  project_number: string;
  year: number;
  donor_name: string;
  recipient_name: string;
  region_name: string;
  sector_name: string;
  usd_commitment_imputed: number;
  usd_disbursement: number;
  project_title: string;
  long_description: string;
  gender: number;
  climate_mitigation: number;
  climate_adaptation: number;
  bucket: 'Integrated' | 'Gender Only' | 'Climate Only';
};