import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CompanySubscribersTable } from "@/components/company-subscribers-table"
import { EditCompanyDialog } from "@/components/edit-company-dialog"
import { AddCorporateSubscriberForm } from "@/components/add-corporate-subscriber-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { IconUserPlus, IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"
import { getCompanyById } from "@/lib/companies/queries"

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface CompanyDetailData {
  company: {
    id: string;
    name: string;
    cnpj: string;
    contactEmail: string;
    contactPhone: string;
    contactPerson: string;
    status: 'active' | 'suspended' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
  };
  plan: {
    id: string;
    companyId: string;
    contractedQuantity: number;
    pricePerSubscriber: number;
    billingDay: number;
    startDate: Date;
    nextBillingDate: Date;
    status: string;
    totalMonthlyValue: number;
  };
  metrics: {
    activeSubscribers: number;
    inactiveSubscribers: number;
    utilizationPercentage: number;
  };
}

async function getCompanyDetail(id: string): Promise<CompanyDetailData | null> {
  try {
    return await getCompanyById(id);
  } catch (error) {
    console.error('Failed to fetch company detail:', error);
    return null;
  }
}

function formatCnpj(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return phone;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge variant="default" className="bg-green-500">Ativo</Badge>;
    case 'suspended':
      return <Badge variant="secondary" className="bg-yellow-500">Suspenso</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Cancelado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth();
  if (!session || !session.user) redirect("/login");

  const { id } = await params;
  const data = await getCompanyDetail(id);

  if (!data) {
    notFound();
  }

  const { company, plan, metrics } = data;

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
              {/* Header */}
              <div className="px-4 lg:px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Link href="/empresas">
                    <Button variant="ghost" size="icon">
                      <IconArrowLeft className="h-5 w-5" />
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-2xl font-semibold">{company.name}</h1>
                    <p className="text-muted-foreground">{formatCnpj(company.cnpj)}</p>
                  </div>
                  {getStatusBadge(company.status)}
                </div>
                <EditCompanyDialog company={company} plan={plan} />
              </div>

              {/* Info Cards */}
              <div className="px-4 lg:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Company Info Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Contato</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Responsável</p>
                      <p className="font-medium">{company.contactPerson}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{company.contactEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{formatPhone(company.contactPhone)}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Plan Info Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Plano</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Quantidade Contratada</p>
                      <p className="font-medium">{plan.contractedQuantity} colaboradores</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Preço por Assinante</p>
                      <p className="font-medium">R$ {plan.pricePerSubscriber.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dia de Cobrança</p>
                      <p className="font-medium">Dia {plan.billingDay}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Billing Info Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Cobrança</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Mensal</p>
                      <p className="text-xl font-bold text-primary">
                        R$ {plan.totalMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Próxima Cobrança</p>
                      <p className="font-medium">
                        {plan.nextBillingDate instanceof Date
                          ? plan.nextBillingDate.toLocaleDateString('pt-BR')
                          : new Date(plan.nextBillingDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Metrics Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Ativos</p>
                      <p className={`text-xl font-bold ${metrics.activeSubscribers > plan.contractedQuantity ? 'text-red-500' : 'text-green-500'}`}>
                        {metrics.activeSubscribers} / {plan.contractedQuantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Inativos</p>
                      <p className="font-medium">{metrics.inactiveSubscribers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Utilização</p>
                      <p className="font-medium">{metrics.utilizationPercentage.toFixed(0)}%</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Subscribers Section */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Colaboradores</CardTitle>
                      <CardDescription>
                        Lista de colaboradores vinculados a esta empresa
                      </CardDescription>
                    </div>
                    {company.status !== 'cancelled' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <IconUserPlus className="mr-2 h-4 w-4" />
                            Adicionar Colaborador
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Adicionar Colaborador</DialogTitle>
                            <DialogDescription>
                              Adicione um novo colaborador ao plano corporativo de {company.name}
                            </DialogDescription>
                          </DialogHeader>
                          <AddCorporateSubscriberForm
                            companyId={company.id}
                            contractedQuantity={plan.contractedQuantity}
                            activeSubscribers={metrics.activeSubscribers}
                          />
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardHeader>
                  <CardContent>
                    <CompanySubscribersTable companyId={company.id} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
