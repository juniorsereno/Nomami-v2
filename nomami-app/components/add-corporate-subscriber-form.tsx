"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, AlertTriangle, Trash2, Plus, Users, User } from "lucide-react"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const singleSchema = z.object({
  name: z.string().min(2, "O nome é obrigatório."),
  cpf: z.string().refine((val) => val.replace(/\D/g, '').length === 11, {
    message: "O CPF deve ter 11 dígitos.",
  }),
  phone: z.string().min(10, "Telefone inválido."),
  email: z.string().email("Email inválido."),
})

const batchSchema = z.object({
  subscribers: z.array(singleSchema).min(1, "Adicione pelo menos um colaborador."),
})

type SingleValues = z.infer<typeof singleSchema>
type BatchValues = z.infer<typeof batchSchema>

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
  const [mode, setMode] = React.useState<"single" | "batch">("single")

  const singleForm = useForm<SingleValues>({
    resolver: zodResolver(singleSchema),
    defaultValues: {
      name: "",
      cpf: "",
      phone: "",
      email: "",
    },
  })

  const batchForm = useForm<BatchValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      subscribers: [{ name: "", cpf: "", phone: "", email: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: batchForm.control,
    name: "subscribers",
  })

  const willExceedLimit = activeSubscribers >= contractedQuantity

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>, field: { onChange: (value: string) => void }) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 0) {
      value = value.replace(/^(\d{3})(\d)/, '$1.$2');
      value = value.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/\.(\d{3})(\d)/, '.$1-$2');
    }

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

  async function onSingleSubmit(values: SingleValues) {
    try {
      const payload = {
        name: values.name,
        cpf: values.cpf.replace(/\D/g, ''),
        phone: values.phone,
        email: values.email,
      };

      const response = await fetch(`/api/companies/${companyId}/subscribers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.code === 'DUPLICATE_CPF') {
          toast.error("CPF já cadastrado nesta empresa.");
          return;
        }
        throw new Error(error.error || 'Falha ao adicionar colaborador.');
      }

      const data = await response.json();
      if (data.warning) toast.warning(data.warning);
      
      toast.success("Colaborador adicionado com sucesso!");
      singleForm.reset();
      router.refresh();
      onSuccess?.();
    } catch {
      toast.error("Erro ao adicionar colaborador. Tente novamente.");
    }
  }

  async function onBatchSubmit(values: BatchValues) {
    try {
      const payload = values.subscribers.map(s => ({
        ...s,
        cpf: s.cpf.replace(/\D/g, ''),
      }));

      const response = await fetch(`/api/companies/${companyId}/subscribers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Falha ao adicionar lote.');

      const data = await response.json();
      
      if (data.errors && data.errors.length > 0) {
        toast.error(`${data.errors.length} erro(s) ao adicionar lote. Veja o log.`);
        console.error('Batch Errors:', data.errors);
      }

      if (data.successCount > 0) {
        toast.success(`${data.successCount} colaborador(es) adicionado(s) com sucesso!`);
        if (data.warning) toast.warning(data.warning);
        batchForm.reset({ subscribers: [{ name: "", cpf: "", phone: "", email: "" }] });
        router.refresh();
        onSuccess?.();
      }
    } catch {
      toast.error("Erro ao adicionar lote. Tente novamente.");
    }
  }

  return (
    <div className="space-y-4 pt-2">
      {willExceedLimit && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Limite atingido ({activeSubscribers}/{contractedQuantity}). 
            Novas adições excederão o limite do plano.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Individual
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Em Lote
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="pt-4">
          <Form {...singleForm}>
            <form onSubmit={singleForm.handleSubmit(onSingleSubmit)} className="space-y-4">
              <FormField
                control={singleForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl><Input placeholder="Nome do colaborador" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={singleForm.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF *</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} onChange={(e) => handleCpfChange(e, field)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={singleForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} onChange={(e) => handlePhoneChange(e, field)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={singleForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={singleForm.formState.isSubmitting}>
                {singleForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {singleForm.formState.isSubmitting ? "Adicionando..." : "Adicionar Colaborador"}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="batch" className="pt-4">
          <Form {...batchForm}>
            <form onSubmit={batchForm.handleSubmit(onBatchSubmit)} className="space-y-4">
              <div className="max-h-[40vh] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">Nome</TableHead>
                      <TableHead className="w-[20%]">CPF</TableHead>
                      <TableHead className="w-[20%]">Telefone</TableHead>
                      <TableHead className="w-[25%]">Email</TableHead>
                      <TableHead className="w-[5%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell className="p-2">
                          <FormField
                            control={batchForm.control}
                            name={`subscribers.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl><Input {...field} className="h-8 text-xs" /></FormControl>
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <FormField
                            control={batchForm.control}
                            name={`subscribers.${index}.cpf`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <Input {...field} className="h-8 text-xs" onChange={(e) => handleCpfChange(e, field)} />
                                </FormControl>
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <FormField
                            control={batchForm.control}
                            name={`subscribers.${index}.phone`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <Input {...field} className="h-8 text-xs" onChange={(e) => handlePhoneChange(e, field)} />
                                </FormControl>
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <FormField
                            control={batchForm.control}
                            name={`subscribers.${index}.email`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl><Input type="email" {...field} className="h-8 text-xs" /></FormControl>
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => remove(index)} 
                            disabled={fields.length <= 1}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: "", cpf: "", phone: "", email: "" })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Linha
                </Button>
                <Button type="submit" size="sm" disabled={batchForm.formState.isSubmitting}>
                  {batchForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {batchForm.formState.isSubmitting ? "Enviando..." : "Enviar Lote"}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
