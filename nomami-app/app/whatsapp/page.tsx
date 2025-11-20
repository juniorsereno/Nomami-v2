'use client';

import { useState, useEffect, useCallback } from 'react';
import { getConnectionState, connectInstance } from './actions';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, QrCode, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

export default function WhatsappPage() {
    const [status, setStatus] = useState<'open' | 'close' | 'connecting' | 'unknown'>('unknown');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(0);

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

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const handleConnect = useCallback(async () => {
        setIsLoading(true);
        setStatus('connecting');
        try {
            const data = await connectInstance();
            if (data?.base64) {
                setQrCode(data.base64);
                setTimer(45);
            } else if (data?.code) {
                // Fallback if the API returns 'code' instead of 'base64' based on user request description
                // The user request said: "code é um QRCode que está em base64"
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
            // Timer expired, refresh QR code
            handleConnect();
        }
        return () => clearInterval(interval);
    }, [timer, qrCode, handleConnect]);

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
                    <div className="flex items-center justify-between space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">Whatsapp</h2>
                        <div className="flex items-center space-x-2">
                            <Button onClick={fetchStatus} disabled={isLoading}>
                                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                Atualizar
                            </Button>
                        </div>
                    </div>

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

                    {(status === 'close' || status === 'connecting') && (
                        <Card className="w-full max-w-md mx-auto mt-8">
                            <CardHeader>
                                <CardTitle>Conectar Whatsapp</CardTitle>
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
                                                alt="QR Code Whatsapp"
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
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
