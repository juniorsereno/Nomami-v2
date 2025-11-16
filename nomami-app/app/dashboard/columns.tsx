"use client"

import { ColumnDef } from "@tanstack/react-table"

export interface Subscriber {
  id: string
  name: string
  phone: string
  cpf: string
  start_date: string
  next_due_date: string
  plan_type: string
}

export const columns: ColumnDef<Subscriber>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "phone",
    header: "Telefone",
  },
  {
    accessorKey: "cpf",
    header: "CPF",
  },
  {
    accessorKey: "start_date",
    header: "Data de Início",
    cell: ({ row }) => {
      const date = new Date(row.getValue("start_date"))
      const formatted = date.toLocaleDateString("pt-BR")
      return <div className="text-left font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "next_due_date",
    header: "Próx. Vencimento",
    cell: ({ row }) => {
      const date = new Date(row.getValue("next_due_date"))
      const formatted = date.toLocaleDateString("pt-BR")
      return <div className="text-left font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "plan_type",
    header: "Plano",
  },
]