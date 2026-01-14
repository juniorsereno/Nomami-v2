"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

const formSchema = z.object({
  name: z.string().min(2, "O nome é obrigatório."),
  cpf: z.string().refine((val) => val.replace(/\D/g, '').length === 11, {
    message: "O CPF deve ter 11 dígitos.",
  }),
  phone: z.string().min(10, "Telefone inválido."),
  email: z.string().email("Email inválido."),
})

type FormValues = z.infer<typeof formSchema>

interface AddCorporateSubscriberFormProps {
  companyId: string;
  contractedQuantity: number;
  activeSubscribers: number;
  onSuccess?: () => void;
}

export function AddCorporateSubscriberForm({ 
  companyId, 
  contractedQuantity, 
  activeSubscribers,
  onSuccess 
}: AddCorporateSubscriberFormProps) {
  const router = useRouter()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cpf: "",
      phone: "",
      email: "",
    },
  })

  const willExceedLimit = activeSubscribers >= contractedQuantity

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>, field: { onChange: (value: string) => void }) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    value = value.replace(/^(\d{3})(\d)/, '$1.$2');
    value = value.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1-$2');

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
        cpf: values.cpf.replace(/\D/g, ''),
        phone: values.phone,
        email: values.email,
      };

      const response = await fetch(`/api/companies/${companyId}/subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.code === 'DUPLICATE_CPF') {
          toast.error("CPF já cadastrado nesta empresa.");
          return;
        }
        if (error.code === 'COMPANY_CANCELLED') {
          toast.error("Não é possível adicionar colaboradores a uma empresa cancelada.");
          return;
        }
        throw new Error(error.error || 'Falha ao adicionar colaborador.');
      }

      const data = await response.json();
      
      if (data.warning) {
        toast.warning(data.warning);
      }
      
      toast.success("Colaborador adicionado com sucesso!");
      form.reset();
      router.refresh();
      onSuccess?.();
    } catch {
      toast.error("Erro ao adicionar colaborador. Tente novamente.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {willExceedLimit && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              A quantidade de colaboradores ativos ({activeSubscribers}) já atingiu ou excedeu 
              a quantidade contratada ({contractedQuantity}). Adicionar este colaborador 
              excederá o limite do plano.
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo *</FormLabel>
              <FormControl>
                <Input placeholder="Nome do colaborador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cpf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="000.000.000-00" 
                  {...field} 
                  onChange={(e) => handleCpfChange(e, field)} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {form.formState.isSubmitting ? "Adicionando..." : "Adicionar Colaborador"}
        </Button>
      </form>
    </Form>
  )
}
