"use client"

import { useEffect, useState, useMemo } from "react"
import { useUser } from "@stackframe/stack"
import { PaginationState } from "@tanstack/react-table"
import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { columns, Subscriber } from "./columns"

interface SubscriberStats {
  activeSubscribers: number;
  mrr: number;
  newSubscribers7d: number;
  newSubscribers30d: number;
  newSubscribersToday: number;
}

function SubscribersPage() {
  useUser({ or: "redirect" });
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
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

  // Fetch stats only once on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsResponse = await fetch('/api/subscribers/stats');
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch subscriber stats');
        }
        const statsData = await statsResponse.json();
        setStats(statsData);
      } catch (error) {
        // Not setting the main error state to avoid blocking the table
        console.error('Failed to load subscriber stats:', error);
      }
    };
    fetchStats();
  }, []);

  // Fetch subscribers when filters change
  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const params = new URLSearchParams();
        if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
        if (plan !== 'all') params.append('plan', plan);
        if (dateRange !== 'all') params.append('dateRange', dateRange);
        params.append('page', (pagination.pageIndex + 1).toString());
        params.append('pageSize', pagination.pageSize.toString());

        const listResponse = await fetch(`/api/subscribers/list?${params.toString()}`);
        if (!listResponse.ok) {
          throw new Error('Failed to fetch subscriber list');
        }
        const listData = await listResponse.json();
        setSubscribers(listData.data);
        setTotalSubscribers(listData.total);
      } catch (error) {
        setError('Failed to load subscriber data. Please try again later.');
      }
    };

    fetchSubscribers();
  }, [debouncedSearchTerm, plan, dateRange, pagination]);

  const pageCount = useMemo(() => {
    return Math.ceil(totalSubscribers / pagination.pageSize);
  }, [totalSubscribers, pagination.pageSize]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <h1 className="px-4 text-2xl font-semibold lg:px-6">Assinantes</h1>
              {error && <p className="px-4 text-red-500 lg:px-6">{error}</p>}
              {stats ? (
                <SectionCards 
                  metrics={{ 
                    activeSubscribers: stats.activeSubscribers, 
                    mrr: stats.mrr,
                    newSubscribers: stats.newSubscribers30d,
                    newSubscribersToday: stats.newSubscribersToday
                  }}
                />
              ) : (
                <div className="px-4 lg:px-6">Carregando estatísticas...</div>
              )}
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
                {subscribers ? (
                  <DataTable
                    columns={columns}
                    data={subscribers}
                    title="Lista de Assinantes"
                    description="Lista completa de todos os assinantes cadastrados."
                    pageCount={pageCount}
                    pagination={pagination}
                    setPagination={setPagination}
                  />
                ) : (
                  <div>Carregando tabela...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default SubscribersPage