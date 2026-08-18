interface StatCardProps {
  label: string;
  value: number | string;
  accent?: boolean;
  icon?: React.ReactNode;
}

export default function StatCard({ label, value, accent = false, icon }: StatCardProps) {
  return (
    <div className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-3 sm:px-6 py-4 sm:py-5 overflow-hidden">
      <div className="flex items-start justify-between gap-2 min-w-0">
        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-snug break-words min-w-0">
          {label}
        </p>
        {icon && <div className="flex-shrink-0">{icon}</div>}
      </div>
      <p
        className={`mt-2 text-lg sm:text-2xl md:text-3xl font-bold tracking-tight truncate ${
          accent ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
        }`}
        title={String(value)}
      >
        {value}
      </p>
    </div>
  );
}