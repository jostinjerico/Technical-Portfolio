import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Project } from "./db/schema";

/**
 * Utility function to merge Tailwind CSS classes
 * Used by shadcn/ui components
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency (USD)
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234567.89) // "$1,234,567.89"
 * formatCurrency(1234567.89, 0) // "$1,234,568"
 */
// export function formatCurrency(value: number, decimals: number = 2): string {
//   if (value === null || value === undefined || isNaN(value)) {
//     return '$0.00';
//   }

//   return new Intl.NumberFormat('en-US', {
//     style: 'currency',
//     currency: 'USD',
//     minimumFractionDigits: decimals,
//     maximumFractionDigits: decimals,
//   }).format(value);
// }

/**
 * Format a number with thousands separators
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1234567.89, 2) // "1,234,567.89"
 */
export function formatNumber(value: number, decimals: number = 0): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a number as a percentage
 * @param value - The numeric value to format (0.0 to 1.0)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 * 
 * @example
 * formatPercentage(0.1234) // "12.3%"
 * formatPercentage(0.1234, 2) // "12.34%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0%';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format large numbers with suffixes (K, M, B, T)
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted number string with suffix
 * 
 * @example
 * formatCompactNumber(1234) // "1.2K"
 * formatCompactNumber(1234567) // "1.2M"
 * formatCompactNumber(1234567890) // "1.2B"
 */
export function formatCompactNumber(value: number, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  const suffixes = ['', 'K', 'M', 'B', 'T'];
  const tier = Math.floor(Math.log10(Math.abs(value)) / 3);

  if (tier === 0) {
    return formatNumber(value, 0);
  }

  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = value / scale;

  return `${scaled.toFixed(decimals)}${suffix}`;
}


/**
 * Calculate percentage change between two values
 * @param current - Current value
 * @param previous - Previous value
 * @returns Object with change value, percentage, and direction
 * 
 * @example
 * calculatePercentageChange(120, 100) // { value: 20, percentage: 0.2, isPositive: true }
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): { value: number; percentage: number; isPositive: boolean } {
  if (previous === 0 || previous === null || previous === undefined) {
    return { value: current, percentage: 0, isPositive: current >= 0 };
  }

  const change = current - previous;
  const percentage = change / previous;
  
  return {
    value: Math.abs(change),
    percentage: Math.abs(percentage),
    isPositive: change >= 0,
  };
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 * 
 * @example
 * truncateText("This is a long text", 10) // "This is a..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Debounce function for performance optimization
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate a random color from the theme palette
 * @returns Random color hex code
 */
export function getRandomThemeColor(): string {
  const colors = [
    '#10b981', // primary (emerald)
    '#a855f7', // secondary (purple)
    '#06b6d4', // accent (cyan)
    '#f59e0b', // warning (amber)
    '#ef4444', // danger (red)
    '#22c55e', // success (green)
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Download data as JSON file
 * @param data - Data to download
 * @param filename - Name of the file
 */
export function downloadJSON(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download data as CSV file
 * @param data - Array of objects to convert to CSV
 * @param filename - Name of the file
 */
export function downloadCSV(data: any[], filename: string): void {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get color for integration bucket
 * @param bucket - Bucket name (Integrated, Gender Only, Climate Only, Neither)
 * @returns Color hex code
 */
export function getBucketColor(bucket: string): string {
  const colorMap: Record<string, string> = {
    'Integrated': '#10b981',
    'Gender Only': '#a855f7',
    'Climate Only': '#06b6d4',
    'Neither': '#64748b',
  };
  return colorMap[bucket] || '#64748b';
}

/**
 * Format date to readable string
 * @param date - Date to format
 * @param format - Format style ('short' | 'medium' | 'long')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  const formatOptions: Record<'short' | 'medium' | 'long', Intl.DateTimeFormatOptions> = {
    short: { year: 'numeric', month: 'numeric', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
  };
  const options = formatOptions[format];

  return new Intl.DateTimeFormat('en-US', options).format(d);
}

// Utility function to export projects to CSV
export const exportToCSV = (projects: Project[], filename: string) => {
  const headers = [
    "Project Title",
    "Donor",
    "Recipient Country",
    "Sector",
    "Year",
    "USD Disbursement",
    "Integration Type",
  ];

  const csvContent = [
    headers.join(","),
    ...projects.map((project) =>
      [
        `"${(project.project_title || "Untitled").replace(/"/g, '""')}"`,
        `"${project.donor_name.replace(/"/g, '""')}"`,
        `"${project.recipient_name.replace(/"/g, '""')}"`,
        `"${project.sector_name.replace(/"/g, '""')}"`,
        project.year,
        project.usd_disbursement * 1_000_000,
        `"${project.bucket}"`,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};






/**
 * Format large numbers into human-readable strings with K/M/B/T suffixes.
 * Assumes input is in USD (not scaled).
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "$0";

  const num = Number(value);

  // num = 1500 → $1.5B (1500 million = 1.5 billion)
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(1)}B`;
  }
  // num = 250 → $250.0M
  if (num >= 1) {
    return `$${num.toFixed(1)}M`;
  }
  // num = 0.5 → $500.0K (0.5 million = 500 thousand)
  if (num >= 0.001) {
    return `$${(num * 1000).toFixed(1)}K`;
  }
  // num = 0.0005 → $500 (0.0005 million = 500 dollars)
  return `$${Math.round(num * 1_000_000)}`;
}

/**
 * Safely parse and convert string/number to float.
 */
export function safeParseFloat(value: any): number {
  const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format integer counts with commas (e.g., 1234 → "1,234")
 */
export function formatCount(value: number | null | undefined): string {
  if (value == null || isNaN(Number(value))) return "0";
  return Number(value).toLocaleString();
}


export function formatNumberRounded(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}