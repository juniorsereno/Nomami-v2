'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Esquema de validação com Zod
const formSchema = z.object({
  fullName: z.string().min(1, { message: 'O nome completo é obrigatório.' }),
  cpf: z.string().regex(/^\d{11}$/, { message: 'O CPF deve conter exatamente 11 dígitos numéricos.' }),
  birthDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, { message: 'Use o formato DD/MM/AAAA.' }),
  gender: z.enum(['F', 'M'], { message: 'Selecione o sexo.' }), // Corrigido: required_error para message
  cellphone: z.string().regex(/^\d{11}$/, { message: 'O celular deve conter exatamente 11 dígitos numéricos.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddTelemedicineFormProps {
  action: 'add' | 'inactivate';
  closeModal: () => void;
}

export function AddTelemedicineForm({ action, closeModal }: AddTelemedicineFormProps) {
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      cpf: '',
      birthDate: '',
      gender: undefined,
      cellphone: '',
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (action === 'inactivate') {
      setFormData(values);
      setIsConfirmationDialogOpen(true);
    } else {
      await sendData(values);
    }
  };

  const handleConfirmInactivation = async () => {
    if (formData) {
      await sendData(formData);
    }
    setIsConfirmationDialogOpen(false);
  };

  const sendData = async (values: FormValues) => {
    const apiBody = [
      {
        Sequencial: '',
        'Nome*': values.fullName,
        'CPF*': parseInt(values.cpf, 10),
        'Data_Nascimento*': values.birthDate,
        'Sexo*': values.gender,
        'Celular*': parseInt(values.cellphone, 10),
        'E-mail': '',
        rg: '',
        fone: '',
        cep: '',
        estado: '',
        cidade: '',
        bairro: '',
        CPF_TITULAR: '',
        relacao_dependente: '',
        'ID_PLANO*': 7,
        'ACAO*': action === 'add' ? 'A' : 'I',
        Grupo: '',
      },
    ];

    try {
      const response = await fetch('/api/telemedicine/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiBody),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`);
      }

      toast.success(`Cliente ${action === 'add' ? 'adicionado' : 'inativado'} com sucesso!`);
      closeModal();
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
      toast.error('Ocorreu um erro. Tente novamente.');
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do cliente" {...field} />
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
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Apenas números" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Nascimento</FormLabel>
                <FormControl>
                  <Input placeholder="DD/MM/AAAA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="F">Feminino</SelectItem>
                    <SelectItem value="M">Masculino</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cellphone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Celular</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Apenas números" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            {action === 'add' ? 'Adicionar' : 'Inativar'}
          </Button>
        </form>
      </Form>

      <AlertDialog open={isConfirmationDialogOpen} onOpenChange={setIsConfirmationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Inativação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja inativar este cliente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmInactivation}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}