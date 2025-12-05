'use client';

import { useState, useEffect } from 'react';
import { useActions, useUIState } from '@ai-sdk/rsc';
import { AI } from '../../app/admin/actions';
import { Send, Bot, User as UserIcon, X, Zap } from 'lucide-react';
import type { ReactNode } from 'react';

interface AnalysisMessage {
    id: number;
    analysis: {
        status: string;
        bilan: string;
        remarques: string[];
        conseil: string | null;
    };
    stats: {
        processed: number;
        total: number;
        errorRate: string;
    };
}

export function AdminChatPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useUIState<typeof AI>();
    const { submitAdminMessage } = useActions<typeof AI>();
    const [isLoading, setIsLoading] = useState(false);
    const [analysisMessages, setAnalysisMessages] = useState<AnalysisMessage[]>([]);

    // Persist chat open state
    useEffect(() => {
        const savedState = sessionStorage.getItem('chatPopupOpen');
        if (savedState === 'true') {
            setIsOpen(true);
        }
    }, []);

    // Listen for payment analysis updates
    useEffect(() => {
        const handleAnalysisUpdate = () => {
            console.log('📨 Received paymentAnalysisUpdate event');
            const analysisData = sessionStorage.getItem('paymentAnalysis');
            if (analysisData) {
                console.log('📊 Analysis data found:', analysisData);
                const data = JSON.parse(analysisData);

                // Add to local analysis messages
                setAnalysisMessages(prev => [...prev, {
                    id: data.id,
                    analysis: data.analysis,
                    stats: data.stats
                }]);

                // Force open chat
                setIsOpen(true);
                sessionStorage.setItem('chatPopupOpen', 'true');

                // Clear after displaying
                sessionStorage.removeItem('paymentAnalysis');
            }
        };

        window.addEventListener('paymentAnalysisUpdate', handleAnalysisUpdate);

        // Also check on mount if there's pending analysis
        const pendingAnalysis = sessionStorage.getItem('paymentAnalysis');
        if (pendingAnalysis) {
            handleAnalysisUpdate();
        }

        return () => window.removeEventListener('paymentAnalysisUpdate', handleAnalysisUpdate);
    }, []);

    const toggleChat = (open: boolean) => {
        setIsOpen(open);
        sessionStorage.setItem('chatPopupOpen', open.toString());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const value = input;
        setInput('');
        setIsLoading(true);

        setMessages((currentMessages: any[]) => [
            ...currentMessages,
            {
                id: Date.now(),
                display: (
                    <div className="flex items-start gap-2 justify-end">
                        <div className="bg-cyan-500/20 border border-cyan-500/30 text-cyan-100 rounded-lg rounded-tr-sm px-3 py-2 max-w-xs backdrop-blur-sm">
                            <p className="text-sm">{value}</p>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-3 h-3 text-cyan-400" />
                        </div>
                    </div>
                )
            }
        ]);

        const response = await submitAdminMessage(value);

        setMessages((currentMessages: any[]) => [
            ...currentMessages,
            {
                id: response.id,
                display: (
                    <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                            <Bot className="w-3 h-3 text-cyan-400" />
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
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => toggleChat(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all hover:scale-110 flex items-center justify-center group backdrop-blur-sm"
                >
                    <Bot className="w-6 h-6 text-cyan-400" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]"></span>
                </button>
            )}

            {/* Chat Popup */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-[#0a0a0a]/95 backdrop-blur-md rounded-lg shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
                    {/* Background Grid Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

                    {/* Header */}
                    <div className="relative z-10 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                                <Zap className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white tracking-tight">GBÈDAGBÉ<span className="text-cyan-400">BOT</span></h3>
                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Online
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleChat(false)}
                            className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors border border-white/5"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {messages.length === 0 && analysisMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                                    <Bot className="w-8 h-8 text-cyan-400" />
                                </div>
                                <h4 className="font-bold text-white mb-2">Bonjour! 👋</h4>
                                <p className="text-sm text-gray-400 mb-4 max-w-xs">
                                    Je peux vous aider à analyser vos fichiers CSV et gérer vos paiements.
                                </p>
                                <button
                                    onClick={() => setInput("Je veux faire un paiement de masse")}
                                    className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-sm font-medium transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                                >
                                    💼 Paiement de masse
                                </button>
                            </div>
                        )}

                        {messages.map((message: { id: number; display: ReactNode }) => (
                            <div key={message.id}>
                                {message.display}
                            </div>
                        ))}

                        {/* Analysis Messages */}
                        {analysisMessages.map((msg) => (
                            <div key={msg.id} className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                                    <Bot className="w-3 h-3 text-purple-400" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    {/* Status Badge */}
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${msg.analysis.status === 'critical' ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400' :
                                                msg.analysis.status === 'warning' ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' :
                                                    'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                                            }`}>
                                            {msg.analysis.status === 'critical' ? '🚨 Critique' :
                                                msg.analysis.status === 'warning' ? '⚠️ Attention' : '✅ OK'}
                                        </span>
                                        <span className="text-[10px] text-gray-500">
                                            {msg.stats.processed}/{msg.stats.total} • {msg.stats.errorRate}% err
                                        </span>
                                    </div>

                                    {/* Bilan */}
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-gray-300">
                                        {msg.analysis.bilan}
                                    </div>

                                    {/* Remarques */}
                                    {msg.analysis.remarques && msg.analysis.remarques.length > 0 && (
                                        <div className="space-y-1">
                                            {msg.analysis.remarques.map((r: string, i: number) => (
                                                <div key={i} className="text-xs text-gray-400 flex items-start gap-1">
                                                    <span className="text-cyan-400">•</span>
                                                    <span>{r}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Conseil */}
                                    {msg.analysis.conseil && (
                                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2 text-xs text-cyan-300">
                                            💡 {msg.analysis.conseil}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-3 h-3 text-cyan-400" />
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-lg rounded-tl-sm px-3 py-2 backdrop-blur-sm">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="relative z-10 p-3 bg-[#0a0a0a]/80 backdrop-blur-md border-t border-white/5">
                        <form onSubmit={handleSubmit} className="flex items-center gap-2">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Demandez-moi..."
                                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 text-sm text-white placeholder-gray-500 transition-all"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
