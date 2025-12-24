'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getConnectionState, connectInstance } from './actions';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Loader2, 
    RefreshCw, 
    QrCode, 
    CheckCircle, 
    XCircle, 
    MessageSquare, 
    Settings, 
    FileText,
    Plus
} from 'lucide-react';
import Image from 'next/image';

import { MessageForm } from '@/components/whatsapp/message-form';
import { MessageList } from '@/components/whatsapp/message-list';
import { AdminPhoneConfig } from '@/components/whatsapp/admin-phone-config';
import { LogsTable, LogFilters } from '@/components/whatsapp/logs-table';
import { CadenceMessage, MessageLog, CreateMessageRequest, UpdateMessageRequest } from '@/lib/whatsapp/types';

export default function WhatsappPage() {
    // Connection state
    const [status, setStatus] = useState<'open' | 'close' | 'connecting' | 'unknown'>('unknown');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(0);

    // Cadence state
    const [messages, setMessages] = useState<CadenceMessage[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [showMessageForm, setShowMessageForm] = useState(false);
    const [editingMessage, setEditingMessage] = useState<CadenceMessage | undefined>();

    // Config state
    const [adminPhone, setAdminPhone] = useState<string | null>(null);
    const [cadenceEnabled, setCadenceEnabled] = useState(true);

    // Logs state
    const [logs, setLogs] = useState<MessageLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsTotal, setLogsTotal] = useState(0);
    const [logsPage, setLogsPage] = useState(1);
    const [logsTotalPages, setLogsTotalPages] = useState(1);
    const [logsFilters, setLogsFilters] = useState<LogFilters>({});

    // Fetch connection status
    const fetchStatus = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getConnectionState();
            const state = data?.instance?.state;
            if (state === 'open') {
                setStatus('open');
                setQrCode(null);
                setTimer(0);
            } else {
                setStatus('close');
            }
        } catch (error) {
            console.error('Failed to fetch status', error);
            setStatus('unknown');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch cadence messages
    const fetchMessages = useCallback(async () => {
        setMessagesLoading(true);
        try {
            const response = await fetch('/api/whatsapp/cadence');
            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error('Failed to fetch messages', error);
            toast.error('Erro ao carregar mensagens');
        } finally {
            setMessagesLoading(false);
        }
    }, []);

    // Fetch config
    const fetchConfig = useCallback(async () => {
        try {
            const response = await fetch('/api/whatsapp/config');
            if (response.ok) {
                const data = await response.json();
                setAdminPhone(data.adminPhone);
                setCadenceEnabled(data.cadenceEnabled ?? true);
            }
        } catch (error) {
            console.error('Failed to fetch config', error);
        }
    }, []);

    // Fetch logs
    const fetchLogs = useCallback(async (page: number = 1, filters: LogFilters = {}) => {
        setLogsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', '10');
            if (filters.status) params.set('status', filters.status);
            if (filters.startDate) params.set('startDate', filters.startDate);
            if (filters.endDate) params.set('endDate', filters.endDate);

            const response = await fetch(`/api/whatsapp/logs?${params}`);
            if (response.ok) {
                const data = await response.json();
                setLogs(data.logs || []);
                setLogsTotal(data.total || 0);
                setLogsPage(data.page || 1);
                setLogsTotalPages(data.totalPages || 1);
            }
        } catch (error) {
            console.error('Failed to fetch logs', error);
            toast.error('Erro ao carregar logs');
        } finally {
            setLogsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
        fetchMessages();
        fetchConfig();
        fetchLogs();
    }, [fetchStatus, fetchMessages, fetchConfig, fetchLogs]);

    // QR Code connection
    const handleConnect = useCallback(async () => {
        setIsLoading(true);
        setStatus('connecting');
        try {
            const data = await connectInstance();
            if (data?.base64) {
                setQrCode(data.base64);
                setTimer(45);
            } else if (data?.code) {
                setQrCode(data.code);
                setTimer(45);
            }
        } catch (error) {
            console.error('Failed to connect', error);
            setStatus('close');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0 && qrCode) {
            handleConnect();
        }
        return () => clearInterval(interval);
    }, [timer, qrCode, handleConnect]);

    // Message handlers
    const handleSaveMessage = async (data: CreateMessageRequest | UpdateMessageRequest) => {
        try {
            if (editingMessage) {
                const response = await fetch(`/api/whatsapp/cadence/${editingMessage.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!response.ok) throw new Error('Failed to update');
                toast.success('Mensagem atualizada!');
            } else {
                const response = await fetch('/api/whatsapp/cadence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!response.ok) throw new Error('Failed to create');
                toast.success('Mensagem adicionada!');
            }
            setShowMessageForm(false);
            setEditingMessage(undefined);
            fetchMessages();
        } catch (error) {
            console.error('Failed to save message', error);
            toast.error('Erro ao salvar mensagem');
        }
    };

    const handleEditMessage = (id: string) => {
        const message = messages.find(m => m.id === id);
        if (message) {
            setEditingMessage(message);
            setShowMessageForm(true);
        }
    };

    const handleDeleteMessage = async (id: string) => {
        try {
            const response = await fetch(`/api/whatsapp/cadence/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete');
            toast.success('Mensagem excluída!');
            fetchMessages();
        } catch (error) {
            console.error('Failed to delete message', error);
            toast.error('Erro ao excluir mensagem');
        }
    };

    const handleReorderMessages = async (messageIds: string[]) => {
        try {
            const response = await fetch('/api/whatsapp/cadence/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageIds }),
            });
            if (!response.ok) throw new Error('Failed to reorder');
            fetchMessages();
        } catch (error) {
            console.error('Failed to reorder messages', error);
            toast.error('Erro ao reordenar mensagens');
        }
    };

    // Config handlers
    const handleSaveAdminPhone = async (phone: string) => {
        try {
            const response = await fetch('/api/whatsapp/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminPhone: phone }),
            });
            if (!response.ok) throw new Error('Failed to save');
            setAdminPhone(phone);
            toast.success('Telefone salvo!');
        } catch (error) {
            console.error('Failed to save config', error);
            toast.error('Erro ao salvar configuração');
        }
    };

    const handleToggleCadence = async (enabled: boolean) => {
        try {
            const response = await fetch('/api/whatsapp/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cadenceEnabled: enabled }),
            });
            if (!response.ok) throw new Error('Failed to toggle');
            setCadenceEnabled(enabled);
            toast.success(enabled ? 'Cadência ativada!' : 'Cadência desativada!');
        } catch (error) {
            console.error('Failed to toggle cadence', error);
            toast.error('Erro ao alterar configuração');
        }
    };

    // Logs handlers
    const handleLogsFilterChange = (filters: LogFilters) => {
        setLogsFilters(filters);
        fetchLogs(1, filters);
    };

    const handleLogsPageChange = (page: number) => {
        fetchLogs(page, logsFilters);
    };

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
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold tracking-tight">WhatsApp</h2>
                        <Button onClick={fetchStatus} disabled={isLoading} variant="outline">
                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Atualizar Status
                        </Button>
                    </div>

                    {/* Status Card */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Status da Instância</CardTitle>
                                {status === 'open' ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : status === 'close' ? (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                ) : (
                                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold capitalize">
                                    {status === 'open' ? 'Conectado' : status === 'close' ? 'Desconectado' : status === 'connecting' ? 'Conectando...' : 'Desconhecido'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {status === 'open' ? 'Instância pronta para uso' : 'Conecte para enviar mensagens'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* QR Code Connection */}
                    {(status === 'close' || status === 'connecting') && (
                        <Card className="w-full max-w-md mx-auto">
                            <CardHeader>
                                <CardTitle>Conectar WhatsApp</CardTitle>
                                <CardDescription>Escaneie o QR Code para conectar sua instância.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center space-y-6">
                                {!qrCode ? (
                                    <Button onClick={handleConnect} disabled={isLoading || status === 'connecting'} className="w-full">
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Gerando QR Code...
                                            </>
                                        ) : (
                                            <>
                                                <QrCode className="mr-2 h-4 w-4" />
                                                Conectar Instância
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="relative h-64 w-64 border-2 border-muted rounded-lg overflow-hidden bg-white">
                                            <Image
                                                src={qrCode.startsWith('data:image') ? qrCode : `data:image/png;base64,${qrCode}`}
                                                alt="QR Code WhatsApp"
                                                fill
                                                className="object-contain p-2"
                                            />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <p className="text-sm text-muted-foreground">Atualiza em: <span className="font-bold text-foreground">{timer}s</span></p>
                                            <Badge variant="outline" className="animate-pulse">Aguardando leitura...</Badge>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setQrCode(null)}>
                                            Cancelar
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Tabs for Cadence, Config, and Logs */}
                    <Tabs defaultValue="cadence" className="w-full">
                        <TabsList>
                            <TabsTrigger value="cadence">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Cadência
                            </TabsTrigger>
                            <TabsTrigger value="config">
                                <Settings className="h-4 w-4 mr-2" />
                                Configurações
                            </TabsTrigger>
                            <TabsTrigger value="logs">
                                <FileText className="h-4 w-4 mr-2" />
                                Logs
                            </TabsTrigger>
                        </TabsList>

                        {/* Cadence Tab */}
                        <TabsContent value="cadence" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Mensagens de Cadência</CardTitle>
                                            <CardDescription>
                                                Configure a sequência de mensagens enviadas para novos assinantes.
                                            </CardDescription>
                                        </div>
                                        <Button onClick={() => { setEditingMessage(undefined); setShowMessageForm(true); }}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Adicionar
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {messagesLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    ) : (
                                        <MessageList
                                            messages={messages}
                                            onEdit={handleEditMessage}
                                            onDelete={handleDeleteMessage}
                                            onReorder={handleReorderMessages}
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Config Tab */}
                        <TabsContent value="config" className="mt-4">
                            <AdminPhoneConfig
                                currentPhone={adminPhone}
                                cadenceEnabled={cadenceEnabled}
                                onSave={handleSaveAdminPhone}
                                onToggleCadence={handleToggleCadence}
                            />
                        </TabsContent>

                        {/* Logs Tab */}
                        <TabsContent value="logs" className="mt-4">
                            <LogsTable
                                logs={logs}
                                isLoading={logsLoading}
                                total={logsTotal}
                                page={logsPage}
                                totalPages={logsTotalPages}
                                onFilterChange={handleLogsFilterChange}
                                onPageChange={handleLogsPageChange}
                                onRefresh={() => fetchLogs(logsPage, logsFilters)}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </SidebarInset>

            {/* Message Form Modal */}
            <MessageForm
                open={showMessageForm}
                message={editingMessage}
                onSave={handleSaveMessage}
                onCancel={() => { setShowMessageForm(false); setEditingMessage(undefined); }}
                existingOrders={messages.map(m => m.orderNumber)}
            />
        </SidebarProvider>
    );
}
