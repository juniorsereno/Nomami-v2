"use client"

import Image from "next/image"
import * as React from "react"
import {
  IconDashboard,
  IconPlus,
  IconSettings,
  IconStethoscope,
  IconUsers,
  IconMessageCircle,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { AddPartnerForm } from "@/components/add-partner-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Gestor NoMami",
    email: "gestor@nomami.com",
    avatar: "/avatars/shadcn.jpg", // Manter o avatar por enquanto
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Assinantes",
      url: "/subscribers",
      icon: IconUsers,
    },
    {
      title: "Parceiros",
      url: "/partners",
      icon: IconUsers, // Usar o mesmo ícone por enquanto
    },
    {
      title: "Tele Medicina",
      url: "/tele-medicine",
      icon: IconStethoscope,
    },
    {
      title: "Whatsapp",
      url: "/whatsapp",
      icon: IconMessageCircle,
    },
  ],
  navSecondary: [
    {
      title: "Configurações",
      url: "/settings",
      icon: IconSettings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = React.useState(false);

  const handlePartnerAdded = () => {
    setIsPartnerDialogOpen(false);
    // Idealmente, aqui você invalidaria o cache de parceiros para forçar um refresh na página de parceiros,
    // mas por enquanto, o fechamento do modal é o principal.
    // Se a página de parceiros usar SWR ou React Query, a revalidação seria automática ao focar a janela.
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="flex justify-center p-4">
        <a href="/dashboard">
          <Image
            src="https://nomami.com.br/assets/LOGO_1752579727506-Cc7LLzXJ.png"
            alt="NoMami Logo"
            width={150}
            height={40}
            className="h-10 w-auto"
          />
        </a>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <div className="grid gap-2 px-4 mt-4">
          <Dialog open={isPartnerDialogOpen} onOpenChange={setIsPartnerDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full justify-start">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black">
                  <IconPlus className="size-4" />
                </div>
                <span className="ml-2 text-sm font-medium">Adicionar Parceiro</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Parceiro</DialogTitle>
                <DialogDescription>
                  Preencha os campos abaixo para adicionar um novo parceiro.
                </DialogDescription>
              </DialogHeader>
              <AddPartnerForm onPartnerAdded={handlePartnerAdded} />
            </DialogContent>
          </Dialog>
        </div>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
