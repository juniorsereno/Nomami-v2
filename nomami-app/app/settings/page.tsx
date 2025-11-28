"use client"

import { useUser } from "@stackframe/stack"
import { toast } from "sonner"
import { AppSidebar } from "@/components/app-sidebar"
import { StripeLogsTable } from "@/components/stripe-logs-table"
import { AsaasLogsTable } from "@/components/asaas-logs-table"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

function SettingsPage() {
  useUser({ or: "redirect" });

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
        <div className="flex flex-1 flex-col p-4 lg:p-6">
          <h1 className="text-2xl font-semibold">Configurações</h1>
          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Integração com Gateway de Pagamento (Stripe)</CardTitle>
                <CardDescription>
                  Configure o webhook abaixo no seu painel do Stripe para receber notificações de pagamento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Input
                    value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/stripe` : ''}
                    readOnly
                  />
                  <Button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}/api/webhook/stripe`);
                        toast.success("Link do webhook copiado para a área de transferência!");
                      }
                    }}
                  >
                    Copiar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <StripeLogsTable />

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Integração com Gateway de Pagamento (Asaas)</CardTitle>
                <CardDescription>
                  Configure o webhook abaixo no seu painel do Asaas para receber notificações de pagamento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Input
                    value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/asaas` : ''}
                    readOnly
                  />
                  <Button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}/api/webhook/asaas`);
                        toast.success("Link do webhook Asaas copiado para a área de transferência!");
                      }
                    }}
                  >
                    Copiar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <AsaasLogsTable />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default SettingsPage