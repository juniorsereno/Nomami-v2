'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';

// Esquema de validação para um único cliente
const clientSchema = z.object({
  fullName: z.string().min(1, { message: 'Nome obrigatório.' }),
  cpf: z.string().regex(/^\d{11}$/, { message: 'CPF inválido.' }),
  birthDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, { message: 'Use DD/MM/AAAA.' }),
  gender: z.enum(['F', 'M'], { message: 'Selecione o sexo.' }),
  cellphone: z.string().regex(/^\d{11}$/, { message: 'Celular inválido.' }),
});

// Esquema para o formulário principal, que contém um array de clientes
const batchFormSchema = z.object({
  clients: z.array(clientSchema).min(1, { message: 'Adicione pelo menos um cliente.' }),
});

type BatchFormValues = z.infer<typeof batchFormSchema>;

interface AddTelemedicineBatchFormProps {
  closeModal: () => void;
  onBatchAdded: () => void;
}

export function AddTelemedicineBatchForm({ closeModal, onBatchAdded }: AddTelemedicineBatchFormProps) {
  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      clients: [{ fullName: '', cpf: '', birthDate: '', gender: '' as 'F' | 'M', cellphone: '' }],
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'clients',
  });

  // Função para formatar a data de nascimento
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: { onChange: (value: string) => void }) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) {
      value = value.slice(0, 8);
    }
    if (value.length > 4) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    } else if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    field.onChange(value);
  };

  const handleSubmit = async (values: BatchFormValues) => {
    setIsSubmitting(true);
    const apiBody = values.clients.map(client => ({
      'Sequencial': '',
      'Nome*': client.fullName,
      'CPF*': parseInt(client.cpf, 10),
      'Data_Nascimento*': client.birthDate,
      'Sexo*': client.gender,
      'Celular*': parseInt(client.cellphone, 10),
      'E-mail': '',
      'rg': '',
      'fone': '',
      'cep': '',
      'estado': '',
      'cidade': '',
      'bairro': '',
      'CPF_TITULAR': '',
      'relacao_dependente': '',
      'ID_PLANO*': 7,
      'ACAO*': 'A',
      'Grupo': '',
    }));

    try {
      const response = await fetch('/api/telemedicine/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiBody),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`);
      }

      toast.success(`${apiBody.length} cliente(s) adicionado(s) com sucesso!`);
      onBatchAdded(); // Chama a função de callback para atualizar a tabela
      closeModal();
    } catch (error) {
      console.error('Erro ao enviar dados em lote:', error);
      toast.error('Ocorreu um erro ao enviar o lote. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Completo</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead>Sexo</TableHead>
                <TableHead>Celular</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`clients.${index}.fullName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`clients.${index}.cpf`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="text"
                              {...field}
                              onChange={(e) => {
                                const { value } = e.target;
                                if (value.length <= 11) {
                                  field.onChange(value.replace(/\D/g, ''));
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`clients.${index}.birthDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="DD/MM/AAAA" {...field} onChange={(e) => handleDateChange(e, field)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`clients.${index}.gender`}
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="F">F</SelectItem>
                              <SelectItem value="M">M</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`clients.${index}.cellphone`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="text"
                              {...field}
                              onChange={(e) => {
                                const { value } = e.target;
                                if (value.length <= 11) {
                                  field.onChange(value.replace(/\D/g, ''));
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-between items-center pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ fullName: '', cpf: '', birthDate: '', gender: '' as 'F' | 'M', cellphone: '' })}
          >
            Adicionar Linha
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Enviando...' : 'Enviar Lote'}
          </Button>
        </div>
      </form>
    </Form>
  );
}