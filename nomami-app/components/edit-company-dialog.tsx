"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const formSchema = z.object({
  name: z.string().min(2, "O nome da empresa é obrigatório."),
  contactEmail: z.string().email("Email inválido."),
  contactPhone: z.string().min(10, "Telefone inválido."),
  contactPerson: z.string().min(2, "Nome do contato é obrigatório."),
  status: z.enum(['active', 'suspended', 'cancelled']),
  contractedQuantity: z.coerce.number().min(1, "Quantidade deve ser maior que zero."),
  billingDay: z.coerce.number().min(1).max(28, "Dia de cobrança deve ser entre 1 e 28."),
  pricePerSubscriber: z.coerce.number().min(0, "Valor não pode ser negativo."),
})

type FormValues = z.infer<typeof formSchema>

interface Company {
  id: string;
  name: string;
  cnpj: string;
  contactEmail: string;
  contactPhone: string;
  contactPerson: string;
  status: 'active' | 'suspended' | 'cancelled';
}

interface Plan {
  contractedQuantity: number;
  billingDay: number;
  pricePerSubscriber: number;
}

interface EditCompanyDialogProps {
  company: Company;
  plan?: Plan;
}

export function EditCompanyDialog({ company, plan }: EditCompanyDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<'cancelled' | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: company.name,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      contactPerson: company.contactPerson,
      status: company.status,
      contractedQuantity: plan?.contractedQuantity ?? 0,
      billingDay: plan?.billingDay ?? 1,
      pricePerSubscriber: plan?.pricePerSubscriber ?? 0,
    },
  })

  // Update default values when plan/company changes
  // This is important if the same dialog instance is reused or data updates in background
  // However, simpler to rely on initial mount for now as standard in this codebase

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: { onChange: (value: string) => void }) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    if (value.length > 10) {
      value = value.slice(0, 10) + '-' + value.slice(10);
    }

    field.onChange(value);
  };

  const handleStatusChange = (value: string, field: { onChange: (value: string) => void }) => {
    if (value === 'cancelled' && company.status !== 'cancelled') {
      setPendingStatus('cancelled');
      setShowCancelConfirm(true);
    } else {
      field.onChange(value);
    }
  };

  const confirmCancelStatus = () => {
    if (pendingStatus) {
      form.setValue('status', pendingStatus);
    }
    setShowCancelConfirm(false);
    setPendingStatus(null);
  };

  const cancelStatusChange = () => {
    setShowCancelConfirm(false);
    setPendingStatus(null);
  };

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        name: values.name,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        contactPerson: values.contactPerson,
        status: values.status,
        plan: {
          contractedQuantity: values.contractedQuantity,
          billingDay: values.billingDay,
          pricePerSubscriber: values.pricePerSubscriber,
        }
      };

      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao atualizar empresa.');
      }

      toast.success("Empresa atualizada com sucesso!");
      setIsOpen(false);
      router.refresh();
    } catch {
      toast.error("Erro ao atualizar empresa. Tente novamente.");
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>
              Atualize as informações da empresa e do plano contratado.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">Dados da Empresa</h4>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Empresa *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da Empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>CNPJ</FormLabel>
                    <Input
                      value={formatCnpj(company.cnpj)}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pessoa de Contato *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do responsável" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(00) 00000-0000"
                            {...field}
                            onChange={(e) => handlePhoneChange(e, field)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select
                          onValueChange={(value) => handleStatusChange(value, field)}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="suspended">Suspenso</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">Dados do Plano</h4>

                  <FormField
                    control={form.control}
                    name="contractedQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade Contratada *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billingDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dia de Cobrança (1-28) *</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="28" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pricePerSubscriber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor por Usuário (R$) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                    <p className="mb-2 font-medium text-foreground">Resumo do Plano:</p>
                    <ul className="space-y-1">
                      <li>Total Mensal: {((form.watch('contractedQuantity') || 0) * (form.watch('pricePerSubscriber') || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</li>
                      <li>Vencimento: Dia {form.watch('billingDay')} de cada mês</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta empresa? Esta ação irá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Desativar todos os colaboradores vinculados</li>
                <li>Impedir a adição de novos colaboradores</li>
                <li>Revogar o acesso aos benefícios do clube</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelStatusChange}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelStatus}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function formatCnpj(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}
