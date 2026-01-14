// src/shared/components/Table/Table.tsx
import React from "react";
import "./Table.css";

export interface TableColumn<T> {
  key: string;
  title: string;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  width?: string | number;
  align?: "left" | "center" | "right";
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = "No data available",
  striped = true,
  hoverable = true,
  compact = false,
  className = "",
}: TableProps<T>) {
  const tableClasses = [
    "table",
    striped ? "table-striped" : "",
    hoverable ? "table-hoverable" : "",
    compact ? "table-compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (data.length === 0) {
    return (
      <div className="table-empty-state">
        <div className="empty-message">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className={tableClasses}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  width: column.width,
                  textAlign: column.align || "left",
                }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={onRowClick ? "clickable-row" : ""}
            >
              {columns.map((column) => (
                <td
                  key={`${keyExtractor(item)}-${column.key}`}
                  style={{ textAlign: column.align || "left" }}
                >
                  {column.render
                    ? column.render((item as any)[column.key], item, index)
                    : (item as any)[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Table Cell Components
export const TableCell: React.FC<
  React.TdHTMLAttributes<HTMLTableCellElement>
> = ({ children, className = "", ...props }) => (
  <td className={`table-cell ${className}`} {...props}>
    {children}
  </td>
);

export const TableHeaderCell: React.FC<
  React.ThHTMLAttributes<HTMLTableCellElement>
> = ({ children, className = "", ...props }) => (
  <th className={`table-header-cell ${className}`} {...props}>
    {children}
  </th>
);

// Table Row Component
export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <tr className={`table-row ${className}`} {...props}>
    {children}
  </tr>
);

// Example of a simple table wrapper for basic use cases
interface SimpleTableProps {
  headers: string[];
  rows: React.ReactNode[][];
  className?: string;
}

export const SimpleTable: React.FC<SimpleTableProps> = ({
  headers,
  rows,
  className = "",
}) => {
  return (
    <div className={`simple-table ${className}`}>
      <table>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
