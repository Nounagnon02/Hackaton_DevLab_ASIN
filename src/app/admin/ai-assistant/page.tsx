'use client';

import { useState } from 'react';
import { useActions, useUIState } from '@ai-sdk/rsc';
import { AI } from '../actions';
import { Send, Bot, User as UserIcon, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

export default function AdminAIAssistantPage() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useUIState<typeof AI>();
    const { submitAdminMessage } = useActions<typeof AI>();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const value = input;
        setInput('');
        setIsLoading(true);

        // Add user message to UI
        setMessages((currentMessages: any[]) => [
            ...currentMessages,
            {
                id: Date.now(),
                display: (
                    <div className="flex items-start gap-3 justify-end">
                        <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-lg">
                            <p className="text-sm leading-relaxed">{value}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-4 h-4 text-emerald-600" />
                        </div>
                    </div>
                )
            }
        ]);

        // Get AI response
        const response = await submitAdminMessage(value);

        setMessages((currentMessages: any[]) => [
            ...currentMessages,
            {
                id: response.id,
                display: (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                            {response.display}
                        </div>
                    </div>
                )
            }
        ]);

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">GbèDagbéBOT Assistant</h1>
                                <p className="text-xs text-gray-500">Votre copilote pour les paiements de masse</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-xs font-medium text-emerald-700">En ligne</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Container */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                                    <Sparkles className="w-10 h-10 text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Bonjour! 👋</h2>
                                    <p className="text-gray-600 max-w-md mb-6">
                                        Je suis GbèDagbéBOT, votre assistant IA pour les paiements de masse.
                                        Je peux vous aider à analyser vos fichiers CSV et détecter les erreurs.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl">
                                    {[
                                        "💼 Je veux faire un paiement de masse",
                                        "📊 Analyse mon fichier CSV",
                                        "❓ Comment fonctionne le système ?",
                                        "🌍 Can you speak English?"
                                    ].map((suggestion, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInput(suggestion)}
                                            className="px-4 py-3 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 rounded-xl text-sm text-left transition-all"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((message: { id: number; display: ReactNode }) => (
                            <div key={message.id}>
                                {message.display}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                        <span className="text-sm text-gray-500">GbèDagbéBOT réfléchit...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <form onSubmit={handleSubmit} className="flex items-end gap-3">
                            <div className="flex-1 bg-white rounded-2xl border border-gray-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSubmit(e);
                                        }
                                    }}
                                    placeholder="Demandez-moi d'analyser votre CSV, de lancer un paiement, ou posez vos questions..."
                                    className="w-full px-4 py-3 resize-none outline-none bg-transparent text-sm max-h-32"
                                    rows={1}
                                    disabled={isLoading}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                Envoyer
                            </button>
                        </form>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                            GbèDagbéBOT peut faire des erreurs. Vérifiez toujours les informations importantes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
