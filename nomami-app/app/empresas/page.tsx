import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { CompanySectionCards } from "@/components/company-section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { columns, CompanyRow } from "./columns"
import { getCompanies as getCompaniesQuery, getCompanyStats as getCompanyStatsQuery } from "@/lib/companies/queries"

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getCompanies(): Promise<CompanyRow[]> {
  try {
    const companies = await getCompaniesQuery();
    return companies.map(c => ({
      id: c.id,
      name: c.name,
      cnpj: c.cnpj,
      contactEmail: c.contactEmail,
      contactPhone: c.contactPhone,
      contactPerson: c.contactPerson,
      status: c.status,
      contractedQuantity: c.contractedQuantity,
      activeSubscribers: c.activeSubscribers,
      monthlyValue: c.monthlyValue,
      createdAt: c.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Failed to fetch companies:', error);
    return [];
  }
}

async function getCompanyStats() {
  try {
    return await getCompanyStatsQuery();
  } catch (error) {
    console.error('Failed to fetch company stats:', error);
    return { totalCompanies: 0, totalCorporateSubscribers: 0, corporateMrr: 0 };
  }
}

async function EmpresasPage() {
  const session = await auth();
  if (!session || !session.user) redirect("/login");

  const [companies, stats] = await Promise.all([
    getCompanies(),
    getCompanyStats(),
  ]);

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
              <h1 className="px-4 text-2xl font-semibold lg:px-6">Empresas</h1>
              <CompanySectionCards stats={stats} />
              <div className="px-4 lg:px-6">
                <DataTable
                  columns={columns}
                  data={companies}
                  title="Lista de Empresas"
                  description="Lista completa de todas as empresas cadastradas com planos corporativos."
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default EmpresasPage
