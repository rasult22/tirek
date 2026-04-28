import { useState } from "react";
import { clsx } from "clsx";
import { Filter } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { CatalogSegment } from "../components/diagnostics/CatalogSegment.js";
import { AssignmentsSegment } from "../components/diagnostics/AssignmentsSegment.js";
import { ResultsSegment } from "../components/diagnostics/ResultsSegment.js";
import { DiagnosticsFiltersSheet } from "../components/diagnostics/DiagnosticsFiltersSheet.js";
import type { DiagnosticsFilters } from "../api/diagnostics.js";

type Segment = "catalog" | "assignments" | "results";

function isFilterActive(filters: DiagnosticsFilters): boolean {
  return Boolean(
    filters.testSlug ||
      filters.severity ||
      filters.grade ||
      filters.classLetter ||
      filters.from ||
      filters.to,
  );
}

export function DiagnosticsPage() {
  const t = useT();
  const [segment, setSegment] = useState<Segment>("catalog");
  const [filters, setFilters] = useState<DiagnosticsFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-text-main">
          {t.psychologist.diagnostics}
        </h1>
        {segment === "results" && (
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-text-main hover:bg-surface-hover"
          >
            <Filter size={14} />
            {t.psychologist.filtersTitle}
            {isFilterActive(filters) && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary" />
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 rounded-xl bg-surface-secondary p-1">
        <button
          type="button"
          onClick={() => setSegment("catalog")}
          className={clsx(
            "h-9 rounded-lg text-xs font-semibold transition-colors",
            segment === "catalog"
              ? "bg-surface text-text-main shadow-sm"
              : "text-text-light",
          )}
        >
          {t.psychologist.diagnosticsSegmentCatalog}
        </button>
        <button
          type="button"
          onClick={() => setSegment("assignments")}
          className={clsx(
            "h-9 rounded-lg text-xs font-semibold transition-colors",
            segment === "assignments"
              ? "bg-surface text-text-main shadow-sm"
              : "text-text-light",
          )}
        >
          {t.psychologist.diagnosticsSegmentAssignments}
        </button>
        <button
          type="button"
          onClick={() => setSegment("results")}
          className={clsx(
            "h-9 rounded-lg text-xs font-semibold transition-colors",
            segment === "results"
              ? "bg-surface text-text-main shadow-sm"
              : "text-text-light",
          )}
        >
          {t.psychologist.diagnosticsSegmentResults}
        </button>
      </div>

      {segment === "catalog" && <CatalogSegment />}
      {segment === "assignments" && <AssignmentsSegment />}
      {segment === "results" && <ResultsSegment filters={filters} />}

      <DiagnosticsFiltersSheet
        open={filtersOpen}
        initial={filters}
        onClose={() => setFiltersOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setFiltersOpen(false);
        }}
      />
    </div>
  );
}
