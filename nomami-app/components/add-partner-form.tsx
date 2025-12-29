"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import * as React from "react"
import { Loader2, Upload } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const categories = [
  "Academia",
  "Alimentação",
  "Amamentação/Pós-parto",
  "Auto Peças",
  "Beleza/Cosméticos",
  "Calçados",
  "Clínicas/Saúde",
  "Construção",
  "Contabilidade",
  "Decoração/Festa",
  "Educação",
  "Enxoval",
  "Esportes",
  "Farmácia",
  "Fotografia/Video",
  "Fraldas",
  "Lazer",
  "Loja de Brinquedos",
  "Maquiagem",
  "Massagem",
  "Mercado/Hostifruti",
  "Perfuração Auricular",
  "Personal Online",
  "Pet Shop/Veterinário",
  "Religioso",
  "Roupa Adulto",
  "Roupa Infantil",
  "Serviços",
  "Telemedicina",
  "Transporte",
  "Vestuário",
] as const;

const formSchema = z.object({
  company_name: z.string().min(2, "O nome da empresa é obrigatório."),
  cnpj: z.string().optional().refine((val) => !val || (val.replace(/\D/g, '').length === 14), {
    message: "O CNPJ deve ter 14 dígitos.",
  }),
  phone: z.string().optional(),
  address: z.string().optional(),
  category: z.enum(categories as unknown as [string, ...string[]], {
    message: "A categoria é obrigatória.",
  }),
  benefit_description: z.string().min(5, "A descrição do benefício é obrigatória."),
  status: z.enum(['ativo', 'inativo']),
  logo_url: z.string().optional(),
  site_url: z.string().optional(),
  instagram_url: z.string().optional(),
})

interface AddPartnerFormProps {
  onPartnerAdded: () => void;
  initialData?: z.infer<typeof formSchema>;
  partnerId?: string;
}

export function AddPartnerForm({ onPartnerAdded, initialData, partnerId }: AddPartnerFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      company_name: "",
      cnpj: "",
      phone: "",
      address: "",
      benefit_description: "",
      status: "ativo",
      logo_url: "",
      site_url: "",
      instagram_url: "",
    },
  })

  const [isUploading, setIsUploading] = React.useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro no upload');
      }

      const data = await response.json();
      form.setValue('logo_url', data.url);
      toast.success('Logo enviada com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar logo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>, field: { onChange: (value: string) => void }) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 14) value = value.slice(0, 14);

    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');

    field.onChange(value);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const cleanedValues = {
        ...values,
        cnpj: values.cnpj ? values.cnpj.replace(/\D/g, '') : '',
      };

      const url = partnerId ? `/api/partners/${partnerId}` : '/api/partners';
      const method = partnerId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedValues),
      });

      if (!response.ok) {
        throw new Error(partnerId ? 'Falha ao atualizar parceiro.' : 'Falha ao adicionar parceiro.');
      }

      toast.success(partnerId ? "Parceiro atualizado com sucesso!" : "Parceiro adicionado com sucesso!");
      onPartnerAdded(); // Chama a função de callback
    } catch {
      toast.error(partnerId ? "Erro ao atualizar parceiro. Tente novamente." : "Erro ao adicionar parceiro. Tente novamente.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="logo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo da Empresa</FormLabel>
              <FormControl>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {field.value && (
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      <Upload className="h-4 w-4" />
                      Logo carregada
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Empresa</FormLabel>
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
              <FormLabel>CNPJ</FormLabel>
              <FormControl>
                <Input placeholder="00.000.000/0000-00" {...field} onChange={(e) => handleCnpjChange(e, field)} />
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
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input placeholder="(XX) XXXXX-XXXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="site_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Site</FormLabel>
              <FormControl>
                <Input placeholder="https://www.exemplo.com.br" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="instagram_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instagram</FormLabel>
              <FormControl>
                <Input placeholder="@usuario" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input placeholder="Rua, Número, Bairro, Cidade - Estado" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="benefit_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Benefício</FormLabel>
              <FormControl>
                <Input placeholder="Descrição do benefício" {...field} />
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
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {form.formState.isSubmitting ? (partnerId ? "Atualizando..." : "Adicionando...") : (partnerId ? "Atualizar" : "Adicionar")}
        </Button>
      </form>
    </Form>
  )
}