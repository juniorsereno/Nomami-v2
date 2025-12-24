"use client"

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Phone, CheckCircle, Power } from 'lucide-react';

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

// Brazilian phone validation regex
const phoneRegex = /^(\+?55)?[\s.-]?\(?[1-9]{2}\)?[\s.-]?9?[0-9]{4}[\s.-]?[0-9]{4}$/;

const formSchema = z.object({
  adminPhone: z.string()
    .min(1, "O telefone é obrigatório.")
    .regex(phoneRegex, "Formato de telefone inválido. Use: (XX) 9XXXX-XXXX"),
});

type FormValues = z.infer<typeof formSchema>;

interface AdminPhoneConfigProps {
  currentPhone: string | null;
  cadenceEnabled: boolean;
  onSave: (phone: string) => Promise<void>;
  onToggleCadence: (enabled: boolean) => Promise<void>;
}

export function AdminPhoneConfig({ currentPhone, cadenceEnabled, onSave, onToggleCadence }: AdminPhoneConfigProps) {
  const [saved, setSaved] = useState(false);
  const [isTogglingCadence, setIsTogglingCadence] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adminPhone: currentPhone || '',
    },
  });

  async function onSubmit(values: FormValues) {
    await onSave(values.adminPhone);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleToggleCadence(enabled: boolean) {
    setIsTogglingCadence(true);
    try {
      await onToggleCadence(enabled);
    } finally {
      setIsTogglingCadence(false);
    }
  }

  // Format phone for display
  const formatPhoneDisplay = (phone: string): string => {
    // Remove non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Remove country code if present
    const localDigits = digits.startsWith('55') ? digits.slice(2) : digits;
    
    if (localDigits.length === 11) {
      // Format: (XX) 9XXXX-XXXX
      return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2, 7)}-${localDigits.slice(7)}`;
    } else if (localDigits.length === 10) {
      // Format: (XX) XXXX-XXXX
      return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2, 6)}-${localDigits.slice(6)}`;
    }
    
    return phone;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: { onChange: (value: string) => void }) => {
    let value = e.target.value;
    
    // Allow only digits, spaces, parentheses, and hyphens
    value = value.replace(/[^\d\s()-]/g, '');
    
    // Auto-format as user types
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 2) {
      value = digits.length > 0 ? `(${digits}` : '';
    } else if (digits.length <= 7) {
      value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length <= 11) {
      value = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else {
      value = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
    
    field.onChange(value);
  };

  return (
    <div className="space-y-4">
      {/* Cadence Toggle Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Power className="h-5 w-5" />
              Disparo de Cadência
            </div>
            <Badge variant={cadenceEnabled ? "default" : "secondary"}>
              {cadenceEnabled ? "Ativo" : "Inativo"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Ative ou desative o envio automático de mensagens para novos assinantes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">
                {cadenceEnabled 
                  ? "Novos assinantes receberão a cadência de mensagens automaticamente."
                  : "O disparo automático está desativado. Novos assinantes não receberão mensagens."}
              </p>
            </div>
            <Switch
              checked={cadenceEnabled}
              onCheckedChange={handleToggleCadence}
              disabled={isTogglingCadence}
            />
          </div>
        </CardContent>
      </Card>

      {/* Admin Phone Card */}
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Telefone do Administrador
        </CardTitle>
        <CardDescription>
          Configure o número que receberá notificações de falhas no envio de mensagens.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="adminPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone WhatsApp</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(61) 99999-9999" 
                      {...field}
                      onChange={(e) => handlePhoneChange(e, field)}
                    />
                  </FormControl>
                  <FormDescription>
                    Número com DDD que receberá alertas de falha.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
              {saved && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Salvo com sucesso!
                </span>
              )}
            </div>
          </form>
        </Form>
        {currentPhone && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Telefone atual: <span className="font-medium text-foreground">{formatPhoneDisplay(currentPhone)}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
