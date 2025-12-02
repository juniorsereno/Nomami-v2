"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface Log {
  id: number;
  received_at: string;
  request_body: Record<string, unknown>;
  error_message: string;
  status: string;
}

export function AsaasLogsTable() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    async function fetchLogs() {
      try {
        const response = await fetch('/api/webhook/asaas/logs');
        if (response.ok) {
          const data = await response.json();
          setLogs(data);
        }
      } catch (error) {
        console.error("Falha ao buscar logs:", error);
      }
    }
    fetchLogs();
  }, []);

  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = logs.slice(startIndex, endIndex);

  const handleReprocess = async (log: Log) => {
    setIsReprocessing(true);
    try {
      const response = await fetch('/api/webhook/asaas/reprocess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payload: log.request_body }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao reprocessar');
      }

      toast.success("Webhook reprocessado com sucesso! Verifique os novos logs.");
      // Opcional: Recarregar logs
      // fetchLogs();
    } catch (error) {
      console.error("Erro ao reprocessar:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao reprocessar webhook");
    } finally {
      setIsReprocessing(false);
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Logs de Eventos do Webhook (Asaas)</h2>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentLogs.length > 0 ? (
              currentLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.received_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'failed' ? 'destructive' : log.status === 'success' ? 'default' : 'secondary'}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="truncate max-w-xs">
                    {log.error_message || 'Processado com sucesso.'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedLog(log)}>
                          Ver Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Log</DialogTitle>
                        </DialogHeader>
                        {selectedLog && (
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-semibold">Mensagem</h3>
                              <p className="text-sm text-muted-foreground">
                                {selectedLog.error_message || 'Processado com sucesso.'}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold">Dados Recebidos</h3>
                              <pre className="mt-2 p-4 bg-muted rounded-lg text-sm max-h-64 overflow-y-auto whitespace-pre-wrap break-all">
                                {JSON.stringify(selectedLog.request_body, null, 2)}
                              </pre>
                            </div>
                            <div className="flex justify-end pt-4">
                              <Button
                                onClick={() => selectedLog && handleReprocess(selectedLog)}
                                disabled={isReprocessing}
                              >
                                {isReprocessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Tentar Novamente (Reprocessar)
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Nenhum log de evento encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}