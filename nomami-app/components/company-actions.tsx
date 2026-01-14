"use client"

import { useRouter } from "next/navigation"
import { MoreHorizontal, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CompanyRow } from "@/app/empresas/columns"

interface CompanyActionsProps {
    company: CompanyRow
}

export function CompanyActions({ company }: CompanyActionsProps) {
    const router = useRouter()

    const handleViewDetails = () => {
        router.push(`/empresas/${company.id}`)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleViewDetails}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Detalhes
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
