'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@stackframe/stack';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AddTelemedicineForm } from '@/components/add-telemedicine-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function TeleMedicinePage() {
  // Proteção de rota para componentes do cliente, conforme a constituição
  const user = useUser({ or: 'redirect' });

  const [dialogAction, setDialogAction] = useState<'add' | 'inactivate'>('add');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!user) {
    // O hook useUser já lida com o redirecionamento, isso previne renderização antes do redirecionamento.
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="grid gap-4">
            <h1 className="text-2xl font-semibold">Tele Medicina</h1>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciamento de Clientes</CardTitle>
                  <CardDescription>
                    Adicione ou inative clientes no serviço de telemedicina.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-start gap-2">
                  <DialogTrigger asChild>
                    <Button onClick={() => setDialogAction('add')}>Adicionar Cliente</Button>
                  </DialogTrigger>
                  <DialogTrigger asChild>
                    <Button variant="destructive" onClick={() => setDialogAction('inactivate')}>
                      Inativar Cliente
                    </Button>
                  </DialogTrigger>
                </CardFooter>
              </Card>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {dialogAction === 'add' ? 'Adicionar Novo Cliente' : 'Inativar Cliente Existente'}
                  </DialogTitle>
                </DialogHeader>
                <AddTelemedicineForm action={dialogAction} closeModal={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}