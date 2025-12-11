'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserSchema, updateUserSchema } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createUser, updateUser } from '@/lib/actions/user-actions';
import { toast } from 'sonner';
import { useTransition } from 'react';

type CreateFormData = z.infer<typeof createUserSchema>;
type UpdateFormData = z.infer<typeof updateUserSchema>;

// Define a minimal User type for props if a full one isn't available
interface User {
    id?: string;
    name?: string;
    email?: string;
    cpf?: string;
    role?: string;
    [key: string]: unknown;
}

interface UserFormProps {
  user?: User | null;
  onSuccess: () => void;
  mode: 'create' | 'edit';
}

export function UserForm({ user, onSuccess, mode }: UserFormProps) {
  const [isPending, startTransition] = useTransition();

  const schema = mode === 'create' ? createUserSchema : updateUserSchema;
  
  const form = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: user || {
      name: '',
      email: '',
      cpf: '',
      role: 'USER',
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: any) => {
    startTransition(async () => {
      let result;
      if (mode === 'create') {
        result = await createUser(data as CreateFormData);
      } else {
        result = await updateUser({ ...data, id: user?.id || '' } as UpdateFormData);
      }

      if (result.success) {
        toast.success(mode === 'create' ? 'Usuário criado com sucesso' : 'Usuário atualizado com sucesso');
        onSuccess();
      } else {
        toast.error(result.error || 'Algo deu errado');
        if (result.validationErrors) {
            // Manually set errors if needed, though zodResolver handles standard ones.
            // This catches server-side uniqueness checks primarily.
            if (result.error?.includes('Email')) {
                form.setError('email', { type: 'manual', message: result.error });
            }
             if (result.error?.includes('CPF')) {
                form.setError('cpf', { type: 'manual', message: result.error });
            }
        }
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="João Silva" {...field} />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="joao@exemplo.com" {...field} />
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
                <Input placeholder="12345678900" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Função</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="USER">Usuário</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {mode === 'edit' && (
           <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Redefinir Senha (Opcional)</FormLabel>
                <FormControl>
                    <Input type="password" placeholder="Nova senha" value={field.value as string || ''} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Salvando...' : mode === 'create' ? 'Criar Usuário' : 'Atualizar Usuário'}
        </Button>
      </form>
    </Form>
  );
}