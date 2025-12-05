'use client';

import { ChatInterface } from '@/components/ai/ChatInterface';
import { ShieldCheck } from 'lucide-react';

export default function PensionerPage() {
    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
            {/* Accessible Header */}
            <header className="bg-white border-b border-slate-200 py-4 px-6 shadow-sm sticky top-0 z-10">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">GBÈDAGBÉ Bénin</h1>
                            <p className="text-sm text-slate-500 font-medium">Espace Retraité</p>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <span className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold border border-emerald-100">
                            Service Actif 24/7
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 flex flex-col">
                <div className="flex-1 flex flex-col">
                    <div className="mb-6 text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Bonjour,</h2>
                        <p className="text-slate-600 text-lg">Comment pouvons-nous vous aider avec votre pension aujourd&apos;hui ?</p>
                    </div>

                    <div className="flex-1">
                        <ChatInterface />
                    </div>
                </div>
            </main>
        </div>
    );
}
