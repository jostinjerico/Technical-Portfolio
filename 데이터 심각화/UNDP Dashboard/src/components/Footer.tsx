type FooterProps = {
  org?: string;              // e.g., "UNDP SEOUL"
  startYear?: number;        // e.g., 2025 (shows "2023–2025" automatically)
  rightsText?: string;       // e.g., "All Rights Reserved."
  variant?: "page" | "card"; // "page" = full width w/ top border, "card" = bordered chip
  className?: string;
};

export function Footer({
  org = "UNDP SEOUL",
  startYear,
  rightsText = "All Rights Reserved.",
  variant = "page",
  className = "",
}: FooterProps) {
  const year = new Date().getFullYear();
  const range = startYear && startYear < year ? `${startYear}–${year}` : String(year);

  const base = "w-full text-[12px] leading-tight";
  const theme =
    variant === "card"
      ? "rounded-md border px-3 py-2"
      : "border-t px-4 py-3";

  return (
    <footer
      role="contentinfo"
      className={`${base} ${theme} ${className} sticky bottom-0 z-10`}
      style={{
        background: "var(--card-bg-color)",
        color: "var(--text-secondary)",
        borderColor: "var(--card-border-weak)",
      }}
    >
      <div className="mx-auto max-w-screen-xl flex items-center justify-center">
        <span>© {range} {org}. {rightsText}.</span>
      </div>
      <div className="mx-auto max-w-screen-xl flex items-center justify-center">
        <span>This project was developed and delivered as a joint initiative between students of Seoul National University of Science and Technology (SeoulTech) and UNDP Seoul.</span>
      </div>
    </footer>
  );
}
