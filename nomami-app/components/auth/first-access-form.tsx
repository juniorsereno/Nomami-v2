'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { firstAccessValidateSchema, firstAccessCompleteSchema } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { validateFirstAccess, completeFirstAccess } from '@/lib/actions/auth-actions';
import { toast } from 'sonner';
import { useState, useTransition } from 'react';
import { useSmoothNavigation } from '@/hooks/use-smooth-navigation';

type ValidateFormData = z.infer<typeof firstAccessValidateSchema>;
type CompleteFormData = z.infer<typeof firstAccessCompleteSchema>;

export function FirstAccessForm() {
  const { navigate } = useSmoothNavigation();
  const [step, setStep] = useState<1 | 2>(1);
  const [isPending, startTransition] = useTransition();
  const [validatedData, setValidatedData] = useState<ValidateFormData | null>(null);

  const validateForm = useForm<ValidateFormData>({
    resolver: zodResolver(firstAccessValidateSchema),
    defaultValues: {
      email: '',
      cpf: '',
    },
  });

  const completeForm = useForm<CompleteFormData>({
    resolver: zodResolver(firstAccessCompleteSchema),
    defaultValues: {
      email: '',
      cpf: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onValidate = (data: ValidateFormData) => {
    startTransition(async () => {
      const result = await validateFirstAccess(data);
      if (result.success) {
        setValidatedData(data);
        completeForm.setValue('email', data.email);
        completeForm.setValue('cpf', data.cpf);
        setStep(2);
      } else {
        toast.error(result.error || 'Falha na validação');
      }
    });
  };

  const onComplete = (data: CompleteFormData) => {
    startTransition(async () => {
      const result = await completeFirstAccess(data);
      if (result.success) {
        toast.success('Senha definida com sucesso. Faça login.');
        navigate('/login');
      } else {
        toast.error(result.error || 'Falha ao definir senha');
      }
    });
  };

  if (step === 1) {
    return (
      <Form {...validateForm}>
        <form onSubmit={validateForm.handleSubmit(onValidate)} className="space-y-4">
          <FormField
            control={validateForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={validateForm.control}
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

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Verificando...' : 'Verificar Identidade'}
          </Button>
        </form>
      </Form>
    );
  }

  return (
    <Form {...completeForm}>
      <form onSubmit={completeForm.handleSubmit(onComplete)} className="space-y-4">
        {/* Hidden fields for email and cpf */}
        <input type="hidden" {...completeForm.register('email')} />
        <input type="hidden" {...completeForm.register('cpf')} />
        
        <div className="bg-muted p-4 rounded-md text-sm mb-4">
            <p><strong>Email:</strong> {validatedData?.email}</p>
            <p><strong>CPF:</strong> {validatedData?.cpf}</p>
        </div>

        <FormField
          control={completeForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Mínimo 8 caracteres" {...field} autoComplete="new-password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={completeForm.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Repita a senha" {...field} autoComplete="new-password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isPending}>
              Voltar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Definindo Senha...' : 'Definir Senha e Entrar'}
            </Button>
        </div>
      </form>
    </Form>
  );
}