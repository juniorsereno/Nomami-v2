"use client"

import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  Image as ImageIcon, 
  Video,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageLog, MessageStatus } from '@/lib/whatsapp/types';

interface LogsTableProps {
  logs: MessageLog[];
  isLoading: boolean;
  total: number;
  page: number;
  totalPages: number;
  onFilterChange: (filters: LogFilters) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export interface LogFilters {
  status?: MessageStatus;
  startDate?: string;
  endDate?: string;
}

function getStatusBadge(status: MessageStatus) {
  switch (status) {
    case 'success':
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Sucesso
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Falha
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Pendente
        </Badge>
      );
  }
}

function getTypeIcon(type: string | null) {
  switch (type) {
    case 'text': return <MessageSquare className="h-4 w-4" />;
    case 'image': return <ImageIcon className="h-4 w-4" />;
    case 'video': return <Video className="h-4 w-4" />;
    default: return <MessageSquare className="h-4 w-4" />;
  }
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function truncateText(text: string | null, maxLength: number = 50): string {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function LogsTable({ 
  logs, 
  isLoading, 
  total,
  page, 
  totalPages, 
  onFilterChange, 
  onPageChange,
  onRefresh 
}: LogsTableProps) {
  const [filters, setFilters] = useState<LogFilters>({});

  const handleStatusChange = (value: string) => {
    const newFilters = { 
      ...filters, 
      status: value === 'all' ? undefined : value as MessageStatus 
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newFilters = { ...filters, [field]: value || undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Logs de Envio
            </CardTitle>
            <CardDescription>
              Histórico de mensagens enviadas para assinantes.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select onValueChange={handleStatusChange} defaultValue="all">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="failed">Falha</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">De:</span>
            <Input
              type="date"
              className="w-[160px]"
              onChange={(e) => handleDateChange('startDate', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Até:</span>
            <Input
              type="date"
              className="w-[160px]"
              onChange={(e) => handleDateChange('endDate', e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Data</TableHead>
                <TableHead>Assinante</TableHead>
                <TableHead className="w-[80px]">Tipo</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead>Erro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum log encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.subscriberName || '-'}</p>
                        <p className="text-sm text-muted-foreground">{log.subscriberPhone || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1" title={log.messageType || 'Desconhecido'}>
                        {getTypeIcon(log.messageType)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(log.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {truncateText(log.errorMessage)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {logs.length} de {total} registros
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || isLoading}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
