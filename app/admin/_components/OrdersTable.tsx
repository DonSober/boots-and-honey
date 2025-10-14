"use client";

import * as React from "react";
import { useMemo } from "react";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from "@tanstack/react-table";
import type { AdminOrder } from "@/packages/types/src";

const columnHelper = createColumnHelper<AdminOrder>();

export default function OrdersTable({ data }: { data: AdminOrder[] }) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("order_number", { header: () => "Order #" }),
      columnHelper.accessor("company_name", { header: () => "Company" }),
      columnHelper.accessor("email", { header: () => "Email" }),
      columnHelper.accessor("status", { header: () => "Status" }),
      columnHelper.accessor("total", { header: () => "Total" }),
      columnHelper.accessor("created_at", { header: () => "Created" }),
    ],
    []
  );

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div>
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}