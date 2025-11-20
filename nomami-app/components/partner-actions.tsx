"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { AddPartnerForm } from "@/components/add-partner-form"
import { Partner } from "@/app/partners/columns"

interface PartnerActionsProps {
    partner: Partner
}

export function PartnerActions({ partner }: PartnerActionsProps) {
    const [isEditOpen, setIsEditOpen] = useState(false)
    const router = useRouter()

    const handlePartnerUpdated = () => {
        setIsEditOpen(false)
        router.refresh()
    }

    const mapStatus = (status: string): "ativo" | "inativo" => {
        return status === 'Ativo' ? 'ativo' : 'inativo';
    }

    // Helper to ensure category is one of the allowed values, or default to the first one if somehow invalid
    // In a real app, you might want better validation here
    const mapCategory = (category: string) => {
        const validCategories = ["Saúde", "Lazer", "Alimentação", "Transporte", "Vestuário", "Serviços"] as const;
        return validCategories.includes(category as any) ? category as any : "Serviços";
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Editar Parceiro</DialogTitle>
                        <DialogDescription>
                            Faça as alterações necessárias nos dados do parceiro.
                        </DialogDescription>
                    </DialogHeader>
                    <AddPartnerForm
                        onPartnerAdded={handlePartnerUpdated}
                        partnerId={partner.id}
                        initialData={{
                            company_name: partner.company_name,
                            cnpj: partner.cnpj,
                            phone: partner.phone,
                            address: partner.address,
                            benefit_description: partner.benefit_description,
                            status: mapStatus(partner.status),
                            category: mapCategory(partner.category),
                        }}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}
