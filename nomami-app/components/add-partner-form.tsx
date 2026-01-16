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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

const categories = [
  "Academia",
  "Alimentação",
  "Amamentação/Pós-parto",
  "Auto Peças",
  "Beleza/Cosméticos",
  "Bem Estar",
  "Calçados",
  "Clínicas",
  "Construção",
  "Contabilidade",
  "Decoração/Festa",
  "Educação",
  "Enxoval",
  "Esportes",
  "Estética",
  "Farmácia",
  "Fotografia/Video",
  "Fraldas",
  "Hortifruti",
  "Lazer",
  "Loja de Brinquedos",
  "Maquiagem",
  "Massagem",
  "Mercado",
  "Ótica",
  "Papelaria",
  "Perfuração Auricular",
  "Personal Online",
  "Pet Shop/Veterinário",
  "Pilates",
  "Religioso",
  "Roupa Adulto",
  "Roupa Infantil",
  "Saúde",
  "Serviços",
  "Telemedicina",
  "Transporte",
  "Vestuário",
] as const;

const formSchema = z.object({
  company_name: z.string().min(2, "O nome da empresa é obrigatório."),
  cnpj: z.string().optional().refine((val) => !val || val === '' || (val.replace(/\D/g, '').length === 14), {
    message: "O CNPJ deve ter 14 dígitos.",
  }),
  phone: z.string().optional(),
  address: z.string().optional(),
  categories: z.array(z.string()).min(1, "Selecione pelo menos uma categoria."),
  benefit_description: z.string().optional(),
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
      categories: [],
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
        cnpj: values.cnpj ? values.cnpj.replace(/\D/g, '') : null,
        address: values.address || null,
        phone: values.phone || null,
        category: values.categories.join(', '), // Converte array para string separada por vírgula
        benefit_description: values.benefit_description || null,
        logo_url: values.logo_url || null,
        site_url: values.site_url || null,
        instagram_url: values.instagram_url || null,
      };

      // Remove o campo categories do objeto enviado
      const { categories, ...dataToSend } = cleanedValues;

      const url = partnerId ? `/api/partners/${partnerId}` : '/api/partners';
      const method = partnerId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
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
          name="categories"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Categorias</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Selecione uma ou mais categorias para o parceiro
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto border rounded-md p-4">
                {categories.map((category) => (
                  <FormField
                    key={category}
                    control={form.control}
                    name="categories"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={category}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(category)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, category])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== category
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            {category}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              {form.watch("categories")?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.watch("categories").map((cat) => (
                    <Badge key={cat} variant="secondary">
                      {cat}
                    </Badge>
                  ))}
                </div>
              )}
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
