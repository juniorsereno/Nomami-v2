"use client"

import { useEffect, useState } from "react"
import { useSession } from "@/hooks/use-session"
import { toast } from "sonner"
import { AppSidebar } from "@/components/app-sidebar"
import { StripeLogsTable } from "@/components/stripe-logs-table"
import { AsaasLogsTable } from "@/components/asaas-logs-table"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import { UserList } from "@/components/admin/user-list"
import { UserForm } from "@/components/admin/user-form"
import { getUsers } from "@/lib/actions/user-actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: string;
  created_at: string;
  [key: string]: unknown;
}

function SettingsPage() {
  useSession({ or: "redirect" });

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const result = await getUsers();
    if (result.success) {
      const data = result.data as User[];
      setUsers(data);
    } else {
      toast.error('Falha ao carregar usuários');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsOpen(true);
  };

  const handleSuccess = () => {
    setIsOpen(false);
    setEditingUser(null);
    fetchUsers();
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingUser(null);
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 lg:p-6">
          <h1 className="text-2xl font-semibold mb-6">Configurações</h1>
          
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium">Gerenciamento de Usuários</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gerencie usuários do sistema, funções e acessos.
                  </p>
                </div>
                <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Adicionar Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingUser ? 'Editar Usuário' : 'Criar Usuário'}</DialogTitle>
                    </DialogHeader>
                    <UserForm
                      user={editingUser || undefined}
                      onSuccess={handleSuccess}
                      mode={editingUser ? 'edit' : 'create'}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <UserList users={users} onEdit={handleEdit} />
              )}
            </TabsContent>

            <TabsContent value="webhooks" className="space-y-4 mt-6">
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Integração com Gateway de Pagamento (Stripe)</CardTitle>
                    <CardDescription>
                      Configure o webhook abaixo no seu painel do Stripe para receber notificações de pagamento.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/stripe` : ''}
                        readOnly
                      />
                      <Button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            navigator.clipboard.writeText(`${window.location.origin}/api/webhook/stripe`);
                            toast.success("Link do webhook copiado para a área de transferência!");
                          }
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <StripeLogsTable />

              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Integração com Gateway de Pagamento (Asaas)</CardTitle>
                    <CardDescription>
                      Configure o webhook abaixo no seu painel do Asaas para receber notificações de pagamento.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/asaas` : ''}
                        readOnly
                      />
                      <Button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            navigator.clipboard.writeText(`${window.location.origin}/api/webhook/asaas`);
                            toast.success("Link do webhook Asaas copiado para a área de transferência!");
                          }
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <AsaasLogsTable />
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default SettingsPage