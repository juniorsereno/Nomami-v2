import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { getPartnerStats, getPartners } from "@/lib/queries"
import { stackServerApp } from "@/stack/server"
import { columns, Partner } from "./columns"

async function PartnersPage() {
  await stackServerApp.getUser({ or: "redirect" });

  const stats = await getPartnerStats();
  const partners = (await getPartners()) as Partner[];

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
              <SectionCards metrics={{ activePartners: stats.activePartners, inactivePartners: stats.inactivePartners, newPartners: stats.newPartners }} />
              <div className="px-4 lg:px-6">
                <DataTable
                  columns={columns}
                  data={partners}
                  title="Lista de Parceiros"
                  description="Lista completa de todos os parceiros cadastrados."
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default PartnersPage