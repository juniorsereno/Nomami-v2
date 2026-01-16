"use client"

import { ColumnDef } from "@tanstack/react-table"
import { PartnerActions } from "@/components/partner-actions"

export interface Partner {
  id: string;
  company_name: string;
  cnpj: string;
  phone?: string | null;
  status: string;
  entry_date: string;
  benefit_description: string;
  address: string;
  category: string;
  logo_url?: string | null;
  site_url?: string | null;
  instagram_url?: string | null;
}

export const columns: ColumnDef<Partner>[] = [
  {
    accessorKey: "company_name",
    header: "Nome da Empresa",
  },
  {
    accessorKey: "category",
    header: "Categoria",
    cell: ({ row }) => {
      const category = row.getValue("category") as string;
      if (!category) return <span className="text-muted-foreground">-</span>;
      
      // Se tiver múltiplas categorias, mostra a primeira + contador
      const categories = category.split(',').map(cat => cat.trim());
      if (categories.length > 1) {
        return (
          <span title={category}>
            {categories[0]} <span className="text-muted-foreground text-xs">+{categories.length - 1}</span>
          </span>
        );
      }
      return <span>{category}</span>;
    },
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
    header: "Ações",
    cell: ({ row }) => <PartnerActions partner={row.original} />,
  },
]