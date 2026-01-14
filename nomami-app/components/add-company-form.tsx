"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import * as React from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

const formSchema = z.object({
  name: z.string().min(2, "O nome da empresa é obrigatório."),
  cnpj: z.string().refine((val) => val.replace(/\D/g, '').length === 14, {
    message: "O CNPJ deve ter 14 dígitos.",
  }),
  contactEmail: z.string().email("Email inválido."),
  contactPhone: z.string().min(10, "Telefone inválido."),
  contactPerson: z.string().min(2, "Nome do contato é obrigatório."),
  contractedQuantity: z.string().refine((val) => parseInt(val, 10) >= 1, {
    message: "Quantidade deve ser pelo menos 1.",
  }),
  pricePerSubscriber: z.string().refine((val) => parseFloat(val) >= 0.01, {
    message: "Preço deve ser maior que zero.",
  }),
  billingDay: z.string().refine((val) => {
    const num = parseInt(val, 10);
    return num >= 1 && num <= 28;
  }, {
    message: "Dia deve ser entre 1 e 28.",
  }),
  startDate: z.string().min(1, "Data de início é obrigatória."),
})

type FormValues = z.infer<typeof formSchema>

interface AddCompanyFormProps {
  onCompanyAdded: () => void;
}

export function AddCompanyForm({ onCompanyAdded }: AddCompanyFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cnpj: "",
      contactEmail: "",
      contactPhone: "",
      contactPerson: "",
      contractedQuantity: "1",
      pricePerSubscriber: "0",
      billingDay: "10",
      startDate: new Date().toISOString().split('T')[0],
    },
  })

  const contractedQuantity = parseInt(form.watch("contractedQuantity") || "0", 10)
  const pricePerSubscriber = parseFloat(form.watch("pricePerSubscriber") || "0")
  const totalMonthlyValue = (contractedQuantity || 0) * (pricePerSubscriber || 0)

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>, field: { onChange: (value: string) => void }) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 14) value = value.slice(0, 14);

    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');

    field.onChange(value);
  };

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

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        name: values.name,
        cnpj: values.cnpj.replace(/\D/g, ''),
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        contactPerson: values.contactPerson,
        plan: {
          contractedQuantity: parseInt(values.contractedQuantity, 10),
          pricePerSubscriber: parseFloat(values.pricePerSubscriber),
          billingDay: parseInt(values.billingDay, 10),
          startDate: values.startDate,
        },
      };

      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.code === 'DUPLICATE_CNPJ') {
          toast.error("CNPJ já cadastrado no sistema.");
          return;
        }
        throw new Error(error.error || 'Falha ao adicionar empresa.');
      }

      toast.success("Empresa adicionada com sucesso!");
      onCompanyAdded();
    } catch {
      toast.error("Erro ao adicionar empresa. Tente novamente.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Dados da Empresa</h3>
          
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

          <FormField
            control={form.control}
            name="cnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="00.000.000/0000-00" 
                    {...field} 
                    onChange={(e) => handleCnpjChange(e, field)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <div className="grid grid-cols-2 gap-4">
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
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Configuração do Plano</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="contractedQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade Contratada *</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormDescription>Número de colaboradores</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricePerSubscriber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço por Assinante (R$) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="billingDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia de Cobrança *</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={28} {...field} />
                  </FormControl>
                  <FormDescription>Dia do mês (1-28)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Início *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valor Mensal Total:</span>
              <span className="text-lg font-semibold">
                R$ {totalMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {form.formState.isSubmitting ? "Adicionando..." : "Adicionar Empresa"}
        </Button>
      </form>
    </Form>
  )
}
