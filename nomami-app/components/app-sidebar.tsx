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
import { SmoothLink } from "@/components/smooth-link"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useSession } from "@/hooks/use-session"

const navMain = [
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
    icon: IconUsers,
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
]

const navSecondary = [
  {
    title: "Configurações",
    url: "/settings",
    icon: IconSettings,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = React.useState(false)
  const session = useSession()

  const user = {
    name: session.user?.name || "Carregando...",
    email: session.user?.email || "",
    avatar: "/avatars/shadcn.jpg",
  }

  const handlePartnerAdded = () => {
    setIsPartnerDialogOpen(false)
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="flex items-center justify-center p-6">
        <SmoothLink href="/dashboard" className="flex justify-center w-full">
          <Image
            src="/nomami-logo.jpeg"
            alt="NoMami Logo"
            width={250}
            height={80}
            className="h-24 w-auto"
          />
        </SmoothLink>
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
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
