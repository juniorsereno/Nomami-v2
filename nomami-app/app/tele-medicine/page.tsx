'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/hooks/use-session';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AddTelemedicineBatchForm } from '@/components/add-telemedicine-batch-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TelemedicineBatchesTable, TelemedicineBatch } from '@/components/telemedicine-batches-table';

export default function TeleMedicinePage() {
  useSession({ or: 'redirect' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [batches, setBatches] = useState<TelemedicineBatch[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchBatches = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/telemedicine/batches/list');
      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }
      const data = await response.json();
      setBatches(data);
    } catch {
      setError('Failed to load batch data. Please try again later.');
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleBatchAdded = () => {
    fetchBatches();
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="grid gap-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold">Tele Medicina</h1>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Adicionar Clientes em Lote</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novos Clientes em Lote</DialogTitle>
                    <DialogDescription>
                      Preencha os dados dos clientes abaixo. Você pode adicionar várias linhas para cadastrar múltiplos clientes de uma só vez.
                    </DialogDescription>
                  </DialogHeader>
                  <AddTelemedicineBatchForm
                    closeModal={() => setIsDialogOpen(false)}
                    onBatchAdded={handleBatchAdded}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <TelemedicineBatchesTable
              batches={batches}
              error={error}
              refreshData={fetchBatches}
            />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}