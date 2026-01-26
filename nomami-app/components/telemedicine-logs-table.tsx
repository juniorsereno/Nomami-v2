'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface TelemedicineLog {
  id: number;
  batch_id: number;
  batch_identifier: string;
  request_body: any;
  response_status: number | null;
  response_body: any;
  error_message: string | null;
  created_at: string;
}

export function TelemedicineLogsTable() {
  const [logs, setLogs] = useState<TelemedicineLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<TelemedicineLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/telemedicine/logs');
      if (!response.ok) throw new Error('Erro ao buscar logs');
      const data = await response.json();
      setLogs(data.logs);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getStatusBadge = (status: number | null, errorMessage: string | null) => {
    if (errorMessage || !status) {
      return <Badge variant="destructive">Erro</Badge>;
    }
    if (status >= 200 && status < 300) {
      return <Badge variant="default" className="bg-green-500">Sucesso</Badge>;
    }
    return <Badge variant="secondary">Status {status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Logs da API de Telemedicina</h2>
        <Button onClick={fetchLogs} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando logs...</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clientes</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum log encontrado
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>{log.batch_identifier || `Lote #${log.batch_id}`}</TableCell>
                    <TableCell>{getStatusBadge(log.response_status, log.error_message)}</TableCell>
                    <TableCell>
                      {Array.isArray(log.request_body) ? log.request_body.length : 0}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Detalhes do Log</DialogTitle>
                          </DialogHeader>
                          {selectedLog && (
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-semibold mb-2">Informações Gerais</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="font-medium">Data/Hora:</span>{' '}
                                    {new Date(selectedLog.created_at).toLocaleString('pt-BR')}
                                  </div>
                                  <div>
                                    <span className="font-medium">Lote:</span>{' '}
                                    {selectedLog.batch_identifier}
                                  </div>
                                  <div>
                                    <span className="font-medium">Status:</span>{' '}
                                    {selectedLog.response_status || 'N/A'}
                                  </div>
                                </div>
                              </div>

                              {selectedLog.error_message && (
                                <div>
                                  <h3 className="font-semibold mb-2 text-red-600">Mensagem de Erro</h3>
                                  <pre className="bg-red-50 p-3 rounded text-sm overflow-x-auto">
                                    {selectedLog.error_message}
                                  </pre>
                                </div>
                              )}

                              <div>
                                <h3 className="font-semibold mb-2">Requisição Enviada</h3>
                                <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(selectedLog.request_body, null, 2)}
                                </pre>
                              </div>

                              {selectedLog.response_body && (
                                <div>
                                  <h3 className="font-semibold mb-2">Resposta da API</h3>
                                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(selectedLog.response_body, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
