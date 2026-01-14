"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { CompanyActions } from "@/components/company-actions"

export interface CompanyRow {
  id: string;
  name: string;
  cnpj: string;
  contactEmail: string;
  contactPhone: string;
  contactPerson: string;
  status: 'active' | 'suspended' | 'cancelled';
  contractedQuantity: number;
  activeSubscribers: number;
  monthlyValue: number;
  createdAt: string;
}

function formatCnpj(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge variant="default" className="bg-green-500">Ativo</Badge>;
    case 'suspended':
      return <Badge variant="secondary" className="bg-yellow-500">Suspenso</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Cancelado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export const columns: ColumnDef<CompanyRow>[] = [
  {
    accessorKey: "name",
    header: "Nome da Empresa",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "cnpj",
    header: "CNPJ",
    cell: ({ row }) => (
      <div className="text-muted-foreground">{formatCnpj(row.getValue("cnpj"))}</div>
    ),
  },
  {
    accessorKey: "contractedQuantity",
    header: "Qtd. Contratada",
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("contractedQuantity")}</div>
    ),
  },
  {
    accessorKey: "activeSubscribers",
    header: "Assinantes Ativos",
    cell: ({ row }) => {
      const active = row.getValue("activeSubscribers") as number;
      const contracted = row.original.contractedQuantity;
      const isOverLimit = active > contracted;
      
      return (
        <div className={`text-center ${isOverLimit ? 'text-red-500 font-medium' : ''}`}>
          {active}
          {isOverLimit && <span className="ml-1 text-xs">(excedido)</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "monthlyValue",
    header: "Valor Mensal",
    cell: ({ row }) => {
      const value = row.getValue("monthlyValue") as number;
      return (
        <div className="text-right font-medium">
          R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.getValue("status")),
  },
  {
    id: "actions",
    cell: ({ row }) => <CompanyActions company={row.original} />,
  },
]
