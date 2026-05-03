import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Project } from "./db/schema";
import { Cursor } from "recharts/types/component/Cursor";

// Currency formatting for compact display (B, M, etc)
export function fmtUSDCompact(n: number | undefined): string {
  if (n == null || isNaN(n)) return "—";
  if (n >= 1_000_000_000_000) {
    return "$" + (n / 1_000_000_000_000).toFixed(2) + "T";
  }
  if (n >= 1_000_000_000) {
    return "$" + (n / 1_000_000_000).toFixed(2) + "B";
  }
  if (n >= 1_000_000) {
    return "$" + (n / 1_000_000).toFixed(2) + "M";
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return "$" + n.toLocaleString();
}

export function fmtInt(n: number | string | undefined | null) {
  if (n == null) return "—";
  const num = typeof n === "string" ? Number(n) : n;
  if (isNaN(num)) return "—";
  return num.toLocaleString();
}

export function toNumberSafe(val: any): number {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.-]/g, "");
    const n = Number(cleaned);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

//calculate percentage change)
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

//count formatting
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

// Percent formatting nice and consistent
export function fmtPct(n: number | undefined): string {
  if (n == null || isNaN(n)) return "—";
  return n.toFixed(1) + "%";
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

export const axisTickStyle = () => ({
  fill: "var(--axis-color)",
  fontSize: 11,
});

export const tooltipWrapperStyle = () => ({           
  pointerEvents: "none" as const,
});

export const tooltipContentStyle = () => ({
  background: "var(--tooltip-bg-color)",
  color: "var(--tooltip-fg-color)",
  border: "1px solid var(--card-border-weak)",
  borderRadius: 10,
  padding: "10px 5px",
  backdropFilter: "blur(6px)",
  
});

export const tooltipLabelStyle = () => ({
  marginBottom: 6,
  fontSize: 13,
  color: "var(--tooltip-text-primary)",
});

// Safe JSON helper so pages don't explode if API returns HTML error
export async function safeJson(res: Response) {
  try {
    const ctype = res.headers.get("content-type") || "";
    if (!res.ok) return null;
    if (!ctype.toLowerCase().includes("application/json")) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Safely parse and convert string/number to float.
 */
export function safeParseFloat(value: any): number {
  const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(parsed) ? 0 : parsed;
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
 * Utility function to merge Tailwind CSS classes
 * Used by shadcn/ui components
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}