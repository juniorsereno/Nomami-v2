"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Subscriber } from "@/app/subscribers/columns"

interface SubscriberDetailsDialogProps {
  subscriber: Subscriber;
  children: React.ReactNode;
}

export function SubscriberDetailsDialog({ subscriber, children }: SubscriberDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Assinante</DialogTitle>
          <DialogDescription>
            Informações completas do assinante.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right font-bold">Nome:</span>
            <span className="col-span-3">{subscriber.name}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right font-bold">Email:</span>
            <span className="col-span-3">{subscriber.email}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right font-bold">Telefone:</span>
            <span className="col-span-3">{subscriber.phone}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right font-bold">CPF:</span>
            <span className="col-span-3">{subscriber.cpf}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right font-bold">Plano:</span>
            <span className="col-span-3">{subscriber.plan_type}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right font-bold">Valor:</span>
            <span className="col-span-3">R$ {subscriber.value ? parseFloat(subscriber.value as any).toFixed(2) : 'N/A'}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right font-bold">Status:</span>
            <span className="col-span-3">{subscriber.status}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right font-bold">Início:</span>
            <span className="col-span-3">{new Date(subscriber.start_date).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right font-bold">Vencimento:</span>
            <span className="col-span-3">{new Date(subscriber.next_due_date).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}