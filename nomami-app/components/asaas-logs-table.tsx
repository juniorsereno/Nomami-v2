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
  const [isReprocessing, setIsReprocessing] = useState<number | null>(null);
  const itemsPerPage = 5;

  async function fetchLogs() {
    try {
      const response = await fetch('/api/webhook/asaas/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Falha ao buscar logs:", error);
      toast.error("Falha ao carregar os logs do Asaas.");
    }
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleReprocess = async (logId: number) => {
    setIsReprocessing(logId);
    try {
      const response = await fetch('/api/webhook/asaas/reprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || "Log reprocessado com sucesso!");
        fetchLogs(); // Re-fetch logs to show the new status
      } else {
        toast.error(result.error || "Falha ao reprocessar o log.");
      }
    } catch (error) {
      toast.error("Ocorreu um erro de rede ao tentar reprocessar.");
    } finally {
      setIsReprocessing(null);
    }
  };

  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = logs.slice(startIndex, endIndex);

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
                          </div>
                        )}
                         {selectedLog?.status === 'failed' && (
                          <Button
                            className="mt-4"
                            onClick={() => handleReprocess(selectedLog.id)}
                            disabled={isReprocessing === selectedLog.id}
                          >
                            {isReprocessing === selectedLog.id ? 'Reprocessando...' : 'Reprocessar'}
                          </Button>
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