"use client"

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Metrics {
  activeSubscribers?: number;
  activePartners?: number;
  inactivePartners?: number;
  newPartners?: number;
  mrr?: number;
  newSubscribers?: number;
  newSubscribersToday?: number;
  expiredThisMonth?: number;
}

interface SectionCardsProps {
  metrics: Metrics;
}

export function SectionCards({ metrics }: SectionCardsProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {metrics.activeSubscribers !== undefined && (
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Clientes Ativos</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {metrics.activeSubscribers}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              Total de clientes com assinatura ativa.
            </div>
          </CardFooter>
        </Card>
      )}
      {metrics.activePartners !== undefined && (
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Parceiros Ativos</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {metrics.activePartners}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              Total de parceiros com status ativo.
            </div>
          </CardFooter>
        </Card>
      )}
      {metrics.inactivePartners !== undefined && (
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Parceiros Inativos</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {metrics.inactivePartners}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              Total de parceiros com status inativo.
            </div>
          </CardFooter>
        </Card>
      )}
      {metrics.newPartners !== undefined && (
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Novos Parceiros (30 dias)</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {metrics.newPartners}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              Parceiros cadastrados nos últimos 30 dias.
            </div>
          </CardFooter>
        </Card>
      )}
      {metrics.mrr !== undefined && (
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>MRR (Valor Recorrente)</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              R$ {metrics.mrr.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">Receita recorrente mensal</div>
          </CardFooter>
        </Card>
      )}
      {metrics.newSubscribers !== undefined && (
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Novos Assinantes (Mês)</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {metrics.newSubscribers}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">Aquisição no mês corrente</div>
          </CardFooter>
        </Card>
      )}
      {metrics.newSubscribersToday !== undefined && (
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Novos Assinantes (Hoje)</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {metrics.newSubscribersToday}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              Assinantes cadastrados hoje.
            </div>
          </CardFooter>
        </Card>
      )}
      {metrics.expiredThisMonth !== undefined && (
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Vencidos (Mês)</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-red-600">
              {metrics.expiredThisMonth}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              Assinaturas vencidas no mês corrente.
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
