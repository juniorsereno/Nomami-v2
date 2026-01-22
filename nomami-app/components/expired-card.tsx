import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle, MessageCircle } from "lucide-react";

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
                    <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white" 
                        size="lg"
                        asChild
                    >
                        <a 
                            href="https://buy.stripe.com/9B6bJ134g15T8rI44J5kk01" 
                            target="_blank" 
                            rel="noopener noreferrer"
                        >
                            Regularizar Agora
                        </a>
                    </Button>
                    
                    <Button 
                        className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white" 
                        size="lg"
                        asChild
                    >
                        <a 
                            href="https://wa.me/5561998212627" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2"
                        >
                            <MessageCircle className="w-5 h-5" />
                            Falar com Suporte
                        </a>
                    </Button>
                    
                    <p className="text-xs text-gray-400 mt-4">
                        Dúvidas? Entre em contato com o suporte pelo WhatsApp.
                    </p>
                </div>
            </div>
        </div>
    );
}
