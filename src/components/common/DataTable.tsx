import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

/**
 * Desktop: semantic table. Mobile: the same rows rendered as cards via
 * `mobileCard`, so no horizontal scrolling is required.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  mobileCard,
  empty,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  mobileCard?: (row: T) => ReactNode;
  empty?: ReactNode;
  className?: string;
}) {
  if (rows.length === 0 && empty) return <div className="p-5">{empty}</div>;

  return (
    <div className={className}>
      <div className={cn("overflow-x-auto", mobileCard && "hidden md:block")}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "px-5 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase whitespace-nowrap",
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === "Enter") onRowClick(row);
                      }
                    : undefined
                }
                className={cn(
                  "border-b border-border/70 last:border-0 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-surface-muted",
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-5 py-3 align-middle", col.className)}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {mobileCard && (
        <ul className="divide-y divide-border md:hidden">
          {rows.map((row) => (
            <li key={rowKey(row)}>
              <button
                type="button"
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className="w-full px-4 py-3 text-left transition-colors hover:bg-surface-muted"
              >
                {mobileCard(row)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
