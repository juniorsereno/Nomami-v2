"use client"

import { useEffect, useState, useMemo } from "react"
import { PaginationState, SortingState } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AddSubscriberForm } from "@/components/add-subscriber-form"
import { columns, Subscriber } from "@/app/subscribers/columns"

interface SubscribersTableProps {
  initialSubscribers: Subscriber[];
  initialTotal: number;
}

export function SubscribersTable({ initialSubscribers, initialTotal }: SubscribersTableProps) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>(initialSubscribers);
  const [totalSubscribers, setTotalSubscribers] = useState(initialTotal);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [plan, setPlan] = useState('all');
  const [status, setStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [subscriberType, setSubscriberType] = useState<'all' | 'individual' | 'corporate'>('all');

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Fetch subscribers when filters change
  const fetchSubscribers = async () => {
    // Skip fetch if it's the initial render with initial data
    if (pagination.pageIndex === 0 && !debouncedSearchTerm && plan === 'all' && status === 'all' && dateRange === 'all' && subscriberType === 'all' && sorting.length === 0) {
      setSubscribers(initialSubscribers);
      setTotalSubscribers(initialTotal);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (plan !== 'all') params.append('plan', plan);
      if (status !== 'all') params.append('status', status);
      if (dateRange !== 'all') params.append('dateRange', dateRange);
      if (subscriberType !== 'all') params.append('subscriberType', subscriberType);
      params.append('page', (pagination.pageIndex + 1).toString());
      params.append('pageSize', pagination.pageSize.toString());

      if (sorting.length > 0) {
        params.append('sort', sorting[0].id);
        params.append('order', sorting[0].desc ? 'desc' : 'asc');
      }

      const listResponse = await fetch(`/api/subscribers/list?${params.toString()}`);
      if (!listResponse.ok) {
        throw new Error('Failed to fetch subscriber list');
      }
      const listData = await listResponse.json();
      setSubscribers(listData.data);
      setTotalSubscribers(listData.total);
    } catch {
      setError('Failed to load subscriber data. Please try again later.');
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [debouncedSearchTerm, plan, status, dateRange, subscriberType, pagination, sorting, initialSubscribers, initialTotal]);

  const pageCount = useMemo(() => {
    return Math.ceil(totalSubscribers / pagination.pageSize);
  }, [totalSubscribers, pagination.pageSize]);

  // Label dinâmico para o filtro de data baseado no status selecionado
  const dateFilterLabel = useMemo(() => {
    if (status === 'vencido') {
      return 'Data de Vencimento';
    } else if (status === 'ativo') {
      return 'Data de Início';
    }
    return 'Data de Criação';
  }, [status]);

  const handleSubscriberAdded = () => {
    // Reset to first page and refresh
    setPagination({ pageIndex: 0, pageSize: 20 });
    fetchSubscribers();
  };

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Buscar por nome ou telefone..."
            className="max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos os Planos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Planos</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos os Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={dateFilterLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer data</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="15d">Últimos 15 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Select value={subscriberType} onValueChange={(value) => setSubscriberType(value as 'all' | 'individual' | 'corporate')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="corporate">Corporativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <AddSubscriberForm onSubscriberAdded={handleSubscriberAdded} />
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <DataTable
        columns={columns}
        data={subscribers}
        title="Lista de Assinantes"
        description="Lista completa de todos os assinantes cadastrados."
        pageCount={pageCount}
        pagination={pagination}
        setPagination={setPagination}
        sorting={sorting}
        setSorting={setSorting}
      />
    </div>
  )
}