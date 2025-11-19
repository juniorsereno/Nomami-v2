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
  const [dateRange, setDateRange] = useState('all');

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
  useEffect(() => {
    const fetchSubscribers = async () => {
      // Skip fetch if it's the initial render with initial data
      if (pagination.pageIndex === 0 && !debouncedSearchTerm && plan === 'all' && dateRange === 'all' && sorting.length === 0) {
        setSubscribers(initialSubscribers);
        setTotalSubscribers(initialTotal);
        return;
      }

      try {
        const params = new URLSearchParams();
        if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
        if (plan !== 'all') params.append('plan', plan);
        if (dateRange !== 'all') params.append('dateRange', dateRange);
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

    fetchSubscribers();
  }, [debouncedSearchTerm, plan, dateRange, pagination, sorting, initialSubscribers, initialTotal]);

  const pageCount = useMemo(() => {
    return Math.ceil(totalSubscribers / pagination.pageSize);
  }, [totalSubscribers, pagination.pageSize]);

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center gap-2 mb-4">
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
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Qualquer data" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer data</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="15d">Últimos 15 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
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