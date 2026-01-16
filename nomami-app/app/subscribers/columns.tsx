import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, FileText, Pencil, ArrowUpDown, CreditCard } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SubscriberDetailsDialog } from "@/components/subscriber-details-dialog"
import { SubscriberEditDialog } from "@/components/subscriber-edit-dialog"
import Link from "next/link"

export interface Subscriber {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpf: string;
  card_id: string;
  plan_type: string;
  start_date: string;
  next_due_date: string;
  status: string;
  value: number;
  subscriber_type?: 'individual' | 'corporate';
  company_id?: string;
  company_name?: string;
}

export const columns: ColumnDef<Subscriber>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "company_name",
    header: "Empresa",
    cell: ({ row }) => {
      const companyName = row.getValue("company_name") as string | undefined;
      if (!companyName) {
        return <span className="text-muted-foreground">-</span>;
      }
      
      // Get only first and second name
      const nameParts = companyName.trim().split(/\s+/);
      const shortName = nameParts.slice(0, 2).join(' ');
      
      return (
        <span className="text-muted-foreground" title={companyName}>
          {shortName}
        </span>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Telefone",
  },
  {
    accessorKey: "plan_type",
    header: "Plano",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "start_date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data de Início
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("start_date"))
      const formatted = date.toLocaleDateString("pt-BR")
      return <div className="text-left font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "next_due_date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Próximo Vencimento
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("next_due_date"))
      const formatted = date.toLocaleDateString("pt-BR")
      return <div className="text-left font-medium">{formatted}</div>
    },
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => {
      const subscriber = row.original
      const handleUpdate = () => {
        // This function will be passed to the edit dialog to trigger a data refresh.
        // In a real app, you'd likely call a function passed down from the main page component
        // to refetch the data. For now, we can just log it.
        console.log("Subscriber updated, refreshing data...");
        window.location.reload(); // Simple refresh for now
      };

      return (
        <div className="flex items-center gap-2">
          <Link href={`/card/${subscriber.card_id}`} target="_blank">
            <Button variant="ghost" size="icon" title="Ver Carteirinha">
              <CreditCard className="h-4 w-4" />
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <SubscriberDetailsDialog subscriber={subscriber}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <FileText className="mr-2 h-4 w-4" />
                  Ver Detalhes
                </DropdownMenuItem>
              </SubscriberDetailsDialog>
              <SubscriberEditDialog subscriber={subscriber} onSubscriberUpdate={handleUpdate}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar Assinante
                </DropdownMenuItem>
              </SubscriberEditDialog>
              <Link href={`/card/${subscriber.card_id}`} target="_blank" className="w-full">
                <DropdownMenuItem>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Ver Carteirinha
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]