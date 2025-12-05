'use client';

import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Eye, Trash2 } from 'lucide-react';
import { TelemedicineBatchDetailsDialog } from './telemedicine-batch-details-dialog';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Tipagem para um cliente individual dentro do lote
interface BatchClient {
  id: number;
  full_name: string;
  cpf: string;
  birth_date: string;
  gender: string;
  cellphone: string;
}

// Tipagem para o lote completo
export interface TelemedicineBatch {
  id: number;
  batch_identifier: string;
  status: string;
  created_at: string;
  client_count: string;
  clients: BatchClient[];
}

// Props para a tabela
interface TelemedicineBatchesTableProps {
  batches: TelemedicineBatch[];
  error: string | null;
  refreshData: () => void;
}

export function TelemedicineBatchesTable({ batches, error, refreshData }: TelemedicineBatchesTableProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<TelemedicineBatch | null>(null);

  const handleInactivateClick = (batch: TelemedicineBatch) => {
    setSelectedBatch(batch);
    setIsConfirmOpen(true);
  };

  const handleConfirmInactivation = async () => {
    if (!selectedBatch) return;

    try {
      const response = await fetch(`/api/telemedicine/batches/${selectedBatch.id}/inactivate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Falha ao inativar o lote.');
      }

      toast.success('Lote inativado com sucesso!');
      refreshData(); // Atualiza os dados na página pai
    } catch {
      toast.error('Erro ao inativar o lote.');
    } finally {
      setIsConfirmOpen(false);
      setSelectedBatch(null);
    }
  };

  // Definir colunas dentro do componente para ter acesso ao estado e handlers
  const columns: ColumnDef<TelemedicineBatch>[] = [
    {
      accessorKey: 'batch_identifier',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Identificador do Lote
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'client_count',
      header: 'Qtd. Clientes',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge variant={status === 'ativo' ? 'default' : 'destructive'}>
            {status === 'ativo' ? 'Ativo' : 'Inativo'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Data de Criação',
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'));
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const batch = row.original;
        return (
          <div className="flex items-center gap-2">
            <TelemedicineBatchDetailsDialog batch={batch}>
              <Button variant="ghost" size="icon">
                <Eye className="h-4 w-4" />
              </Button>
            </TelemedicineBatchDetailsDialog>
            {batch.status === 'ativo' && (
              <Button variant="ghost" size="icon" onClick={() => handleInactivateClick(batch)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="mt-8">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <DataTable
          columns={columns}
          data={batches}
          title="Lotes de Clientes"
          description="Lista de todos os lotes de clientes cadastrados na telemedicina."
        />
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Inativação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja inativar o lote <strong>{selectedBatch?.batch_identifier}</strong>? Esta ação enviará a inativação para todos os {selectedBatch?.client_count} clientes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmInactivation}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}