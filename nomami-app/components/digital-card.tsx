import React from 'react';
import { CardContent } from "@/components/ui/card";
import Image from 'next/image';

interface DigitalCardProps {
    subscriber: {
        name: string;
        cpf: string;
        next_due_date: string;
        plan_type: string;
    }
}

export function DigitalCard({ subscriber }: DigitalCardProps) {
    const formattedDate = new Date(subscriber.next_due_date).toLocaleDateString('pt-BR');

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-gray-100 p-4 overflow-hidden">
            {/* Page Background Image */}

            <div className="relative z-10 w-full max-w-sm perspective-1000">
                <div className="relative w-full h-56 bg-gradient-to-br from-gray-900 via-slate-800 to-black rounded-xl shadow-2xl overflow-hidden transform transition-transform hover:scale-105 duration-300">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-35">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        </svg>
                    </div>

                    <CardContent className="relative z-10 flex flex-col h-full p-6 text-white">
                        {/* Header with Logo */}
                        <div className="flex justify-between items-start">
                            <div className="relative w-32 h-12">
                                <Image
                                    src="/logo.webp"
                                    alt="Nomami Logo"
                                    fill
                                    className="object-contain object-left"
                                    priority
                                />
                            </div>
                        </div>

                        {/* Chip Icon - Centered vertically relative to card, right aligned */}
                        <div className="absolute top-1/2 -translate-y-1/2 right-6">
                            <div className="w-12 h-10 bg-yellow-400 rounded-md opacity-80 flex items-center justify-center overflow-hidden shadow-sm">
                                <div className="w-full h-[1px] bg-black opacity-20 mb-1"></div>
                                <div className="w-full h-[1px] bg-black opacity-20 mt-1"></div>
                                <div className="h-full w-[1px] bg-black opacity-20 ml-1"></div>
                                <div className="h-full w-[1px] bg-black opacity-20 mr-1"></div>
                            </div>
                        </div>

                        {/* Subscriber Info - Pushed down */}
                        <div className="mt-auto mb-8 ml-0">
                            <p className="text-xs opacity-75 uppercase mb-1">Nome do Titular</p>
                            <h2 className="text-xl font-medium tracking-wide truncate">{subscriber.name}</h2>
                        </div>

                        {/* Footer Info */}
                        <div className="flex justify-between items-end mt-2">
                            <div>
                                <p className="text-[10px] opacity-75 uppercase">CPF</p>
                                <p className="font-mono text-sm tracking-wider">{subscriber.cpf}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] opacity-75 uppercase">Válido Até</p>
                                <p className="font-mono text-sm font-bold">{formattedDate}</p>
                            </div>
                        </div>
                        {/* Plan Type Badge */}
                        <div className="absolute top-9 right-6">
                            <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold uppercase border border-white/30">
                                Membro
                            </span>
                        </div>
                    </CardContent>
                </div>

                <div className="mt-5 text-center text-black-600">
                    <p className="text-medium font-bold">Apresente este cartão digital para obter seus benefícios.</p>
                </div>

                <div className="mt-6 text-center">
                    <a
                        href="/parceiros"
                        className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-[#602986] rounded-full shadow-lg hover:bg-[#4b206a] transition-colors duration-200 gap-2"
                    >
                        <span>Ver Lista de Parceiros</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    </a>
                </div>
            </div >
        </div >
    );
}
