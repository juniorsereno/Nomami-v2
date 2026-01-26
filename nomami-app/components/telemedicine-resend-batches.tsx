'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Send, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ResendResult {
  processed: number;
  success: number;
  failed: number;
  details: Array<{
    batchId: number;
    batchIdentifier: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
}

export function TelemedicineResendBatches() {
  const [isResending, setIsResending] = useState(false);
  const [result, setResult] = useState<ResendResult | null>(null);

  const handleResendAll = async () => {
    setIsResending(true);
    setResult(null);

    try {
      const response = await fetch('/api/telemedicine/batches/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Sem batchIds = reenvia todos
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao reenviar lotes');
      }

      const data = await response.json();
      setResult(data);

      if (data.success > 0) {
        toast.success(`${data.success} lote(s) reenviado(s) com sucesso!`);
      }
      if (data.failed > 0) {
        toast.error(`${data.failed} lote(s) falharam ao reenviar`);
      }
      if (data.processed === 0) {
        toast.info('Nenhum lote ativo encontrado para reenviar');
      }

    } catch (error) {
      console.error('Erro ao reenviar lotes:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao reenviar lotes');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Reenviar Lotes Ativos
        </CardTitle>
        <CardDescription>
          Reenvia todos os lotes ativos para a API de telemedicina. Use isso após corrigir CPFs ou outros problemas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="default" 
              disabled={isResending}
              className="w-full sm:w-auto"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reenviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Reenviar Todos os Lotes Ativos
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Reenvio</AlertDialogTitle>
              <AlertDialogDescription>
                Isso irá reenviar TODOS os lotes com status &quot;ativo&quot; para a API de telemedicina.
                <br /><br />
                Os dados serão enviados com os CPFs corrigidos do banco de dados.
                <br /><br />
                Deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleResendAll}>
                Sim, Reenviar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {result && (
          <div className="space-y-3 mt-4">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">
                Processados: {result.processed}
              </Badge>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Sucesso: {result.success}
              </Badge>
              {result.failed > 0 && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Falhas: {result.failed}
                </Badge>
              )}
            </div>

            {result.details && result.details.length > 0 && (
              <div className="border rounded-lg p-3 max-h-64 overflow-y-auto">
                <h4 className="font-semibold text-sm mb-2">Detalhes:</h4>
                <div className="space-y-2">
                  {result.details.map((detail, index) => (
                    <div 
                      key={index} 
                      className={`text-sm p-2 rounded ${
                        detail.status === 'success' 
                          ? 'bg-green-50 text-green-800' 
                          : 'bg-red-50 text-red-800'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {detail.status === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">
                            Lote #{detail.batchId}: {detail.batchIdentifier}
                          </div>
                          {detail.error && (
                            <div className="text-xs mt-1 opacity-80">
                              {detail.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
