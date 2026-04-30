import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Right-aligned cell (numbers, badges). Defaults to false. */
  align?: "left" | "right";
  /** Width hint applied via inline style (e.g. "120px", "20%"). */
  width?: string;
  /** Hide on small screens (< sm breakpoint). */
  hideOnSmall?: boolean;
  /** Enable header click to sort by this key. */
  sortable?: boolean;
  /** Sort comparator. Required when sortable=true. */
  sortValue?: (row: T) => string | number | null | undefined;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  /** Group rows by a derived key. Group header is sticky. */
  groupBy?: (row: T) => string;
  /** Render group header given the group key and row count. */
  renderGroupHeader?: (groupKey: string, count: number) => ReactNode;
  /** Predicate for group collapse — when true the group's rows are hidden but header stays visible. */
  isGroupCollapsed?: (groupKey: string) => boolean;
  /** Whole-row click handler. Adds hover state. */
  onRowClick?: (row: T) => void;
  /** Optional empty-state replacement. */
  empty?: ReactNode;
  /** Compact paddings for high-density screens. */
  density?: "default" | "compact";
}

type SortState = { key: string; dir: "asc" | "desc" } | null;

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  groupBy,
  renderGroupHeader,
  isGroupCollapsed,
  onRowClick,
  empty,
  density = "default",
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null);

  const sortedData = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return data;
    const arr = [...data];
    arr.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [data, columns, sort]);

  const groups = useMemo(() => {
    if (!groupBy) return null;
    const map = new Map<string, T[]>();
    for (const row of sortedData) {
      const k = groupBy(row);
      const list = map.get(k);
      if (list) list.push(row);
      else map.set(k, [row]);
    }
    return Array.from(map.entries());
  }, [sortedData, groupBy]);

  if (data.length === 0 && empty) {
    return <>{empty}</>;
  }

  const cellPadY = density === "compact" ? "py-2" : "py-2.5";
  const cellPadX = "px-3";

  const handleHeaderClick = (col: DataTableColumn<T>) => {
    if (!col.sortable || !col.sortValue) return;
    setSort((prev) => {
      if (!prev || prev.key !== col.key) return { key: col.key, dir: "asc" };
      if (prev.dir === "asc") return { key: col.key, dir: "desc" };
      return null;
    });
  };

  const headerRow = (
    <tr className="border-b border-border bg-surface-secondary">
      {columns.map((col) => {
        const sortable = col.sortable && col.sortValue;
        const active = sort?.key === col.key;
        const alignClass = col.align === "right" ? "text-right" : "text-left";
        const visibilityClass = col.hideOnSmall ? "hidden sm:table-cell" : "";
        return (
          <th
            key={col.key}
            scope="col"
            style={col.width ? { width: col.width } : undefined}
            className={`${cellPadX} ${cellPadY} ${alignClass} ${visibilityClass} text-[11px] font-semibold uppercase tracking-wide text-text-light`}
          >
            {sortable ? (
              <button
                type="button"
                onClick={() => handleHeaderClick(col)}
                className={`inline-flex items-center gap-1 ${
                  col.align === "right" ? "flex-row-reverse" : ""
                } hover:text-text-main`}
              >
                <span>{col.header}</span>
                {active && sort?.dir === "asc" && <ChevronUp size={12} />}
                {active && sort?.dir === "desc" && <ChevronDown size={12} />}
              </button>
            ) : (
              col.header
            )}
          </th>
        );
      })}
    </tr>
  );

  const renderRow = (row: T) => {
    const interactive = !!onRowClick;
    return (
      <tr
        key={getRowKey(row)}
        onClick={interactive ? () => onRowClick(row) : undefined}
        className={`border-b border-border-light last:border-b-0 ${
          interactive ? "cursor-pointer row-hover" : ""
        }`}
      >
        {columns.map((col) => {
          const alignClass = col.align === "right" ? "text-right" : "text-left";
          const visibilityClass = col.hideOnSmall ? "hidden sm:table-cell" : "";
          return (
            <td
              key={col.key}
              className={`${cellPadX} ${cellPadY} ${alignClass} ${visibilityClass} text-sm text-text-main align-middle`}
            >
              {col.cell(row)}
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full border-collapse text-left">
        <thead>{headerRow}</thead>
        {groups ? (
          groups.map(([groupKey, rows]) => {
            const collapsed = isGroupCollapsed?.(groupKey) ?? false;
            return (
              <tbody key={groupKey}>
                <tr className="sticky top-0 z-[1]">
                  <td
                    colSpan={columns.length}
                    className="bg-surface-secondary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-light border-b border-border"
                  >
                    {renderGroupHeader ? (
                      renderGroupHeader(groupKey, rows.length)
                    ) : (
                      <span>
                        {groupKey}
                        <span className="ml-2 font-normal normal-case tracking-normal text-text-light/70">
                          · {rows.length}
                        </span>
                      </span>
                    )}
                  </td>
                </tr>
                {!collapsed && rows.map(renderRow)}
              </tbody>
            );
          })
        ) : (
          <tbody>{sortedData.map(renderRow)}</tbody>
        )}
      </table>
    </div>
  );
}
