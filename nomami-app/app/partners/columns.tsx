"use client"

import { ColumnDef } from "@tanstack/react-table"
import { PartnerActions } from "@/components/partner-actions"

export interface Partner {
  id: string;
  company_name: string;
  cnpj: string;
  phone: string;
  status: string;
  entry_date: string;
  benefit_description: string;
  address: string;
  category: string;
}

export const columns: ColumnDef<Partner>[] = [
  {
    accessorKey: "company_name",
    header: "Nome da Empresa",
  },
  {
    accessorKey: "cnpj",
    header: "CNPJ",
  },
  {
    accessorKey: "phone",
    header: "Telefone",
  },
  {
    accessorKey: "address",
    header: "Endereço",
  },
  {
    accessorKey: "benefit_description",
    header: "Benefício",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "entry_date",
    header: "Data de Entrada",
    cell: ({ row }) => {
      const date = new Date(row.getValue("entry_date"))
      const formatted = date.toLocaleDateString("pt-BR")
      return <div className="text-left font-medium">{formatted}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <PartnerActions partner={row.original} />,
  },
]