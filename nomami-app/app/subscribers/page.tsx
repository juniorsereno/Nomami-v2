import { AppSidebar } from "@/components/app-sidebar"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { getSubscriberStats, getSubscribers } from "@/lib/queries"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SubscribersTable } from "@/components/subscribers-table"
import { Subscriber } from "./columns"

async function SubscribersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const stats = await getSubscriberStats();
  const initialSubscribersData = await getSubscribers({});
  
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
              <SectionCards
                metrics={{
                  activeSubscribers: stats.activeSubscribers,
                  mrr: stats.mrr,
                  newSubscribers: stats.newSubscribers30d,
                  newSubscribersToday: stats.newSubscribersToday
                }}
              />
              <SubscribersTable
                initialSubscribers={initialSubscribersData.data as Subscriber[]}
                initialTotal={initialSubscribersData.total}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default SubscribersPage