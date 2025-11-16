import { useEffect, useState } from "react"
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
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
}

interface Variations {
  mrrVariation: number;
  newSubscribersVariation: number;
}

interface SectionCardsProps {
  metrics: Metrics;
}

export function SectionCards({ metrics }: SectionCardsProps) {
  const [variations, setVariations] = useState<Variations | null>(null);

  useEffect(() => {
    const fetchVariations = async () => {
      try {
        const response = await fetch('/api/metrics/variations');
        if (!response.ok) {
          throw new Error('Failed to fetch variations');
        }
        const data = await response.json();
        setVariations(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchVariations();
  }, []);

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
            {variations && (
              <CardAction>
                <Badge variant="outline">
                  {variations.mrrVariation >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                  {variations.mrrVariation.toFixed(1)}%
                </Badge>
              </CardAction>
            )}
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
            {variations && (
              <CardAction>
                <Badge variant="outline">
                  {variations.newSubscribersVariation >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                  {variations.newSubscribersVariation.toFixed(1)}%
                </Badge>
              </CardAction>
            )}
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
    </div>
  )
}
