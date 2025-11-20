import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export function ExpiredCard() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Assinatura Vencida</h1>
                <p className="text-gray-600 mb-8">
                    Sua carteirinha está temporariamente indisponível porque sua assinatura expirou. Regularize agora para voltar a aproveitar os benefícios.
                </p>

                <div className="space-y-3">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
                        Regularizar Agora
                    </Button>
                    <p className="text-xs text-gray-400 mt-4">
                        Dúvidas? Entre em contato com o suporte.
                    </p>
                </div>
            </div>
        </div>
    );
}
