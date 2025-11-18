'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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
interface TelemedicineBatch {
  id: number;
  batch_identifier: string;
  status: string;
  created_at: string;
  client_count: string;
  clients: BatchClient[];
}

interface BatchDetailsDialogProps {
  batch: TelemedicineBatch;
  children: React.ReactNode;
}

export function TelemedicineBatchDetailsDialog({ batch, children }: BatchDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Lote: {batch.batch_identifier}</DialogTitle>
          <DialogDescription>
            Visualizando {batch.client_count} cliente(s) incluído(s) neste lote.
            <Badge variant={batch.status === 'active' ? 'default' : 'destructive'} className="ml-2">
              {batch.status === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Completo</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead>Sexo</TableHead>
                <TableHead>Celular</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batch.clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.full_name}</TableCell>
                  <TableCell>{client.cpf}</TableCell>
                  <TableCell>{client.birth_date}</TableCell>
                  <TableCell>{client.gender}</TableCell>
                  <TableCell>{client.cellphone}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}