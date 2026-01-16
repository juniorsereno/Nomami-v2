"use client"

import React from 'react';
import { CardContent } from "@/components/ui/card";
import { NomamiLogo } from "@/components/nomami-logo";
import { QRCodeSVG } from 'qrcode.react';

interface DigitalCardProps {
    subscriber: {
        name: string;
        cpf?: string;
        card_id?: string;
        next_due_date: string;
        plan_type: string;
        subscriber_type?: 'individual' | 'corporate';
        company_name?: string;
        status?: string;
    }
}

export function DigitalCard({ subscriber }: DigitalCardProps) {
    const formattedDate = new Date(subscriber.next_due_date).toLocaleDateString('pt-BR');
    const isCorporate = subscriber.subscriber_type === 'corporate';
    const isInactive = subscriber.status === 'inativo';

    // For inactive corporate subscribers, show a different message
    if (isInactive && isCorporate) {
        return (
            <div 
                className="relative flex items-center justify-center min-h-screen bg-gray-100 p-4 overflow-hidden select-none"
                onContextMenu={(e) => e.preventDefault()}
            >
                <div className="relative z-10 w-full max-w-sm">
                    <div className="relative w-full h-64 bg-gradient-to-br from-gray-600 via-gray-500 to-gray-700 rounded-xl shadow-2xl overflow-hidden">
                        <CardContent className="relative z-10 flex flex-col h-full p-6 text-white pointer-events-none">
                            <div className="flex justify-between items-start">
                                <div className="relative w-32 h-12 opacity-50">
                                    <NomamiLogo width={128} height={48} priority />
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="text-center">
                                    <p className="text-lg font-semibold mb-2">Cartão Inativo</p>
                                    <p className="text-sm opacity-75">
                                        Este cartão corporativo não está mais ativo.
                                    </p>
                                    {subscriber.card_id && (
                                        <p className="text-xs opacity-60 mt-2">
                                            Cartão Nº: {subscriber.card_id}
                                        </p>
                                    )}
                                    {subscriber.company_name && (
                                        <p className="text-xs opacity-60 mt-2">
                                            Empresa: {subscriber.company_name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="text-center">
                                <p className="text-xs opacity-60">
                                    Entre em contato com sua empresa para mais informações.
                                </p>
                            </div>

                            {/* QR Code - Bottom Left Corner */}
                            {subscriber.card_id && (
                                <div className="absolute bottom-4 left-8 bg-white p-1 rounded">
                                    <QRCodeSVG
                                        value={`${typeof window !== 'undefined' ? window.location.origin : 'https://nomami.com.br'}/verificar/${subscriber.card_id}`}
                                        size={60}
                                        bgColor="#FFFFFF"
                                        fgColor="#000000"
                                        level="M"
                                        marginSize={1}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="relative flex items-center justify-center min-h-screen bg-gray-100 p-4 overflow-hidden select-none"
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Page Background Image */}

            <div className="relative z-10 w-full max-w-sm perspective-1000">
                <div className={`relative w-full h-64 ${isCorporate ? 'bg-gradient-to-br from-indigo-900 via-purple-800 to-violet-900' : 'bg-gradient-to-br from-gray-900 via-slate-800 to-black'} rounded-xl shadow-2xl overflow-hidden transform transition-transform hover:scale-105 duration-300`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-35">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        </svg>
                    </div>

                    <CardContent className="relative z-10 flex flex-col h-full p-6 text-white pointer-events-none">
                        {/* Header with Logo */}
                        <div className="flex justify-between items-start">
                            <div className="relative w-32 h-12">
                                <NomamiLogo width={128} height={48} priority />
                            </div>
                        </div>

                        {/* Chip Icon - Centered vertically relative to card, right aligned */}
                        <div className="absolute top-1/2 -translate-y-1/2 right-6">
                            <div className="relative w-12 h-10 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 rounded-md shadow-lg">
                                {/* Chip grid pattern */}
                                <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 gap-[1px] p-1.5">
                                    <div className="bg-yellow-600/40 rounded-[1px]"></div>
                                    <div className="bg-yellow-600/40 rounded-[1px]"></div>
                                    <div className="bg-yellow-600/40 rounded-[1px]"></div>
                                    <div className="bg-yellow-600/40 rounded-[1px]"></div>
                                    <div className="bg-yellow-600/40 rounded-[1px]"></div>
                                    <div className="bg-yellow-600/40 rounded-[1px]"></div>
                                    <div className="bg-yellow-600/40 rounded-[1px]"></div>
                                    <div className="bg-yellow-600/40 rounded-[1px]"></div>
                                    <div className="bg-yellow-600/40 rounded-[1px]"></div>
                                    <div className="bg-yellow-600/40 rounded-[1px]"></div>
                                    <div className="bg-yellow-600/40 rounded-[1px]"></div>
                                    <div className="bg-yellow-600/40 rounded-[1px]"></div>
                                </div>
                                {/* Shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-md"></div>
                            </div>
                        </div>

                        {/* Subscriber Info - Pushed down */}
                        <div className={`mt-auto ml-0 pr-20 ${isCorporate ? 'mb-2' : 'mb-8'}`}>
                            {/* Company Name for Corporate Subscribers */}
                            {isCorporate && subscriber.company_name && (
                                <div className="mb-2">
                                    <p className="text-[10px] opacity-75 uppercase">Empresa</p>
                                    <p className="text-xs font-medium opacity-90 truncate" data-protected="true">
                                        {subscriber.company_name}
                                    </p>
                                </div>
                            )}
                            <p className="text-xs opacity-75 uppercase mb-1">Nome do Titular</p>
                            <h2 
                                className="font-medium tracking-wide leading-tight break-words" 
                                data-protected="true"
                                style={{
                                    fontSize: subscriber.name.length > 30 ? '0.875rem' : subscriber.name.length > 20 ? '1rem' : '1.25rem'
                                }}
                            >
                                {subscriber.name}
                            </h2>
                            {/* Card ID Display */}
                            {subscriber.card_id && (
                                <p className="text-xs opacity-75 mt-1" data-protected="true">
                                    Cartão Nº: {subscriber.card_id}
                                </p>
                            )}
                        </div>

                        {/* Footer Info */}
                        <div className={`flex justify-end items-end ${isCorporate ? 'mt-0' : 'mt-2'}`}>
                            <div className="text-right">
                                <p className="text-[10px] opacity-75 uppercase">Válido Até</p>
                                <p className="font-mono text-sm font-bold" data-protected="true">{formattedDate}</p>
                            </div>
                        </div>
                        {/* Plan Type Badge */}
                        <div className="absolute top-9 right-6">
                            <span className={`${isCorporate ? 'bg-purple-500/30' : 'bg-white/20'} backdrop-blur-sm px-2 py-1 rounded text-xs font-bold uppercase border ${isCorporate ? 'border-purple-300/30' : 'border-white/30'}`}>
                                {isCorporate ? 'Corporativo' : 'Membro'}
                            </span>
                        </div>

                        {/* QR Code - Bottom Left Corner */}
                        {subscriber.card_id && (
                            <div className="absolute bottom-4 left-6 bg-white p-1 rounded">
                                <QRCodeSVG
                                    value={`${typeof window !== 'undefined' ? window.location.origin : 'https://nomami.com.br'}/verificar/${subscriber.card_id}`}
                                    size={60}
                                    bgColor="#FFFFFF"
                                    fgColor="#000000"
                                    level="M"
                                    marginSize={1}
                                />
                            </div>
                        )}
                    </CardContent>
                </div>

                <div className="mt-5 text-center text-black-600">
                    <p className="text-medium font-bold">Apresente este cartão digital para obter seus benefícios.</p>
                </div>

                <div className="mt-6 text-center">
                    <a
                        href="/parceiros"
                        className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-[#602986] rounded-full shadow-lg hover:bg-[#4b206a] transition-colors duration-200 gap-2 pointer-events-auto"
                    >
                        <span>Ver Lista de Parceiros</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    </a>
                </div>
            </div >
        </div >
    );
}
