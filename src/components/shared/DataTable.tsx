import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  mobileRenderer?: (item: T) => React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  onRowClick,
  emptyMessage = "No results found.",
  mobileRenderer,
}: DataTableProps<T>) {
  return (
    <>
      {mobileRenderer && (
        <div className="md:hidden flex flex-col space-y-4">
          {data.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white border rounded-xl shadow-sm">
              {emptyMessage}
            </div>
          ) : (
            data.map((item, i) => (
              <div 
                key={i} 
                onClick={() => onRowClick && onRowClick(item)}
                className={onRowClick ? "cursor-pointer" : ""}
              >
                {mobileRenderer(item)}
              </div>
            ))
          )}
        </div>
      )}

      <div className={`rounded-xl border bg-card shadow-sm overflow-hidden ${mobileRenderer ? "hidden md:block" : ""}`}>
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent">
              {columns.map((column, index) => (
                <TableHead key={index} className="h-11 font-medium text-slate-500">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`group ${onRowClick ? "cursor-pointer hover:bg-slate-50" : ""}`}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className="py-3">
                      {column.cell
                        ? column.cell(item)
                        : (item[column.accessorKey as keyof T] as React.ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
