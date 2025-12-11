"use client"

import { useEffect, useState } from "react"
import { useSession } from "@/hooks/use-session"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { getCurrentUser, updateProfile, updatePassword } from "@/lib/actions/profile-actions"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AccountPage() {
  useSession({ or: "redirect" })

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ name: string; email: string; role: string; created_at: string } | null>(null)
  
  // Profile form
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Password form
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    setLoading(true)
    const result = await getCurrentUser()
    if (result.success && result.data) {
      const userData = result.data as { name: string; email: string; role: string; created_at: string }
      setUser(userData)
      setName(userData.name)
      setEmail(userData.email)
    } else {
      toast.error("Erro ao carregar dados do usuário")
    }
    setLoading(false)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)

    const result = await updateProfile({ name, email })
    
    if (result.success) {
      toast.success("Perfil atualizado com sucesso")
      loadUser()
    } else {
      toast.error(result.error || "Erro ao atualizar perfil")
    }

    setIsUpdatingProfile(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem")
      return
    }

    setIsUpdatingPassword(true)

    const result = await updatePassword({ currentPassword, newPassword })
    
    if (result.success) {
      toast.success("Senha atualizada com sucesso")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } else {
      toast.error(result.error || "Erro ao atualizar senha")
    }

    setIsUpdatingPassword(false)
  }

  if (loading) {
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
          <div className="flex flex-1 items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

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
          <div className="mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>

          <div className="space-y-6 max-w-2xl">
            <div>
              <h1 className="text-2xl font-semibold">Minha Conta</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie suas informações pessoais e configurações de segurança
              </p>
            </div>

            <Separator />

            {/* Informações do Perfil */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>
                  Atualize seu nome e email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Função</Label>
                    <Input
                      value={user?.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <Button type="submit" disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Alterar Senha */}
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>
                  Atualize sua senha para manter sua conta segura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground">
                      Mínimo de 8 caracteres
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                  </div>

                  <Button type="submit" disabled={isUpdatingPassword}>
                    {isUpdatingPassword ? "Atualizando..." : "Atualizar Senha"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
