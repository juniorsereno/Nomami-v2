"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { IconTrash, IconLoader2 } from "@tabler/icons-react"

interface CorporateSubscriber {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  status: 'ativo' | 'inativo' | 'vencido';
  cardId: string;
  startDate: string;
  nextDueDate: string;
  removedAt?: string;
}

interface CompanySubscribersTableProps {
  companyId: string;
}

function formatCpf(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return phone;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'ativo':
      return <Badge variant="default" className="bg-green-500">Ativo</Badge>;
    case 'inativo':
      return <Badge variant="secondary">Inativo</Badge>;
    case 'vencido':
      return <Badge variant="destructive">Vencido</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function CompanySubscribersTable({ companyId }: CompanySubscribersTableProps) {
  const router = useRouter()
  const [subscribers, setSubscribers] = useState<CorporateSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/companies/${companyId}/subscribers?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch subscribers');
      
      const data = await response.json();
      setSubscribers(data.data || []);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast.error('Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  }, [companyId, debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleRemoveSubscriber = async (subscriberId: string) => {
    setRemovingId(subscriberId);
    try {
      const response = await fetch(`/api/companies/${companyId}/subscribers/${subscriberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao remover colaborador');
      }

      toast.success('Colaborador removido com sucesso');
      fetchSubscribers();
      router.refresh();
    } catch (error) {
      console.error('Error removing subscriber:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao remover colaborador');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar por nome, CPF ou telefone..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos os Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : subscribers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum colaborador encontrado
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Card ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Início</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell className="font-medium">{subscriber.name}</TableCell>
                  <TableCell>{formatCpf(subscriber.cpf)}</TableCell>
                  <TableCell>{formatPhone(subscriber.phone)}</TableCell>
                  <TableCell>{subscriber.email}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {subscriber.cardId}
                    </code>
                  </TableCell>
                  <TableCell>{getStatusBadge(subscriber.status)}</TableCell>
                  <TableCell>
                    {new Date(subscriber.startDate).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {subscriber.status === 'ativo' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            disabled={removingId === subscriber.id}
                          >
                            {removingId === subscriber.id ? (
                              <IconLoader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <IconTrash className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Colaborador</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover {subscriber.name} do plano corporativo?
                              O colaborador será marcado como inativo e não terá mais acesso aos benefícios.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveSubscriber(subscriber.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
