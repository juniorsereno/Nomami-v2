"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
  SortingState,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  title: string
  description: string
  pageCount?: number
  pagination?: PaginationState
  setPagination?: React.Dispatch<React.SetStateAction<PaginationState>>
  sorting?: SortingState
  setSorting?: React.Dispatch<React.SetStateAction<SortingState>>
}

export function DataTable<TData, TValue>({
  columns,
  data,
  title,
  description,
  pageCount = 0,
  pagination,
  setPagination,
  sorting,
  setSorting,
}: DataTableProps<TData, TValue>) {
  const isPaginated = !!pagination && !!setPagination;
  const isSorted = !!sorting && !!setSorting;

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      ...(isPaginated && { pagination }),
      ...(isSorted && { sorting }),
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    manualPagination: isPaginated,
    manualSorting: isSorted,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-4 space-y-0">
        <div className="grid flex-1 gap-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      {isPaginated && (
        <CardFooter className="flex items-center justify-center gap-2 border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {table.getState().pagination!.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próximo
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}