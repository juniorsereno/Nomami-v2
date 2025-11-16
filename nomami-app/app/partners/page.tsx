"use client"

import { useEffect, useState } from "react"
import { useUser } from "@stackframe/stack"
import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { columns } from "./columns" // Será criado a seguir

interface PartnerStats {
  activePartners: number;
  inactivePartners: number;
  newPartners: number;
}

interface Partner {
  company_name: string;
  cnpj: string;
  phone: string;
  status: string;
  entry_date: string;
  benefit_description: string;
  address: string;
}

function PartnersPage() {
  useUser({ or: "redirect" });
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsResponse = await fetch('/api/partners/stats');
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch partner stats');
        }
        const statsData = await statsResponse.json();
        setStats(statsData);

        const listResponse = await fetch('/api/partners/list');
        if (!listResponse.ok) {
          throw new Error('Failed to fetch partner list');
        }
        const listData = await listResponse.json();
        setPartners(listData);

      } catch (error) {
        setError('Failed to load partner data. Please try again later.');
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
              <h1 className="px-4 text-2xl font-semibold lg:px-6">Parceiros</h1>
              {error && <p className="px-4 text-red-500 lg:px-6">{error}</p>}
              {stats ? <SectionCards metrics={{ activePartners: stats.activePartners, inactivePartners: stats.inactivePartners, newPartners: stats.newPartners }} /> : <div className="px-4 lg:px-6">Carregando estatísticas...</div>}
              <div className="px-4 lg:px-6">
                {partners ? (
                  <DataTable
                    columns={columns}
                    data={partners}
                    title="Lista de Parceiros"
                    description="Lista completa de todos os parceiros cadastrados."
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

export default PartnersPage