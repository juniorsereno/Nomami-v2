"use client"

import { useEffect, useState } from "react"
import { useUser } from "@stackframe/stack"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { columns, Subscriber } from "./columns"

interface Metrics {
  activeSubscribers: number;
  activePartners: number;
  mrr: number;
  newSubscribers: number;
}

function DashboardPage() {
  useUser({ or: "redirect" });
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Metrics
        const metricsResponse = await fetch('/api/metrics');
        if (!metricsResponse.ok) {
          throw new Error('Failed to fetch metrics');
        }
        const metricsData = await metricsResponse.json();

        const partnersResponse = await fetch('/api/partners/active');
        if (!partnersResponse.ok) {
          throw new Error('Failed to fetch active partners');
        }
        const partnersData = await partnersResponse.json();
        setMetrics({ ...metricsData, activePartners: partnersData.activePartners });

        // Fetch Latest Subscribers
        const subscribersResponse = await fetch('/api/subscribers/latest');
        if (!subscribersResponse.ok) {
          throw new Error('Failed to fetch latest subscribers');
        }
        const subscribersData = await subscribersResponse.json();
        setSubscribers(subscribersData);

      } catch (error) {
        setError('Failed to load data. Please try again later.');
      }
    };

    fetchData();
  }, []);

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
              {error && <p>{error}</p>}
              {metrics ? <SectionCards metrics={metrics} /> : <div>Loading...</div>}
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <div className="px-4 lg:px-6">
                <DataTable
                  columns={columns}
                  data={subscribers}
                  title="Últimos Assinantes"
                  description="Mostrando os últimos 10 assinantes."
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default DashboardPage
