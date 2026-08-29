"use client";

import { useMemo, useState } from "react";
import { Renewal } from "@/lib/types";
import RenewalItem from "./RenewalItem";
import EmptyState from "./EmptyState";

interface RenewalsListProps {
  renewals: Renewal[];
  onEdit: (renewal: Renewal) => void;
  onDelete: (id: string) => void;
  onMarkRenewed: (id: string) => void;
  onAddRenewal?: () => void;
}

const statusFilters: { label: string; value: Renewal["status"] | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Due Soon", value: "due-soon" },
  { label: "Overdue", value: "overdue" },
  { label: "Renewed", value: "renewed" },
  { label: "Cancelled", value: "cancelled" },
];

function InboxIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function SearchOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function RenewalsList({
  renewals,
  onEdit,
  onDelete,
  onMarkRenewed,
  onAddRenewal,
}: RenewalsListProps) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<Renewal["status"] | "all">("all");

  const searchMatched = useMemo(() => {
    return renewals.filter(
      (r) =>
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.category.toLowerCase().includes(query.toLowerCase())
    );
  }, [renewals, query]);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: searchMatched.length };
    statusFilters.forEach((f) => {
      if (f.value !== "all") {
        counts[f.value] = searchMatched.filter((r) => r.status === f.value).length;
      }
    });
    return counts;
  }, [searchMatched]);

  const filtered = useMemo(() => {
    return searchMatched.filter((r) => activeFilter === "all" || r.status === activeFilter);
  }, [searchMatched, activeFilter]);

  const hasNoRenewalsAtAll = renewals.length === 0;
  const hasNoMatches = !hasNoRenewalsAtAll && filtered.length === 0;

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search renewals..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 pr-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors cursor-pointer"
              aria-label="Clear search"
              title="Clear search"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((f) => {
            const count = filterCounts[f.value] ?? 0;
            const isActive = activeFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]"
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`inline-flex min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[var(--border)] text-[var(--text-muted)]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {hasNoRenewalsAtAll ? (
          <EmptyState
            icon={<InboxIcon />}
            title="No renewals yet"
            description="Add your first subscription or renewal to start tracking upcoming payments."
            actionLabel={onAddRenewal ? "+ Add renewal" : undefined}
            onAction={onAddRenewal}
          />
        ) : hasNoMatches ? (
          <EmptyState
            icon={<SearchOffIcon />}
            title="No matching renewals"
            description="Try a different search term or clear the active filter."
          />
        ) : (
          filtered.map((r) => (
            <RenewalItem
              key={r.id}
              renewal={r}
              onEdit={onEdit}
              onDelete={onDelete}
              onMarkRenewed={onMarkRenewed}
            />
          ))
        )}
      </div>
    </div>
  );
}