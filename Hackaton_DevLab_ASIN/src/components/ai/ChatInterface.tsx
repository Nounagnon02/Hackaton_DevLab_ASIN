'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useUIState, useActions } from '@ai-sdk/rsc';
import type { AI } from '@/app/actions';
import { Mic, Send, User, Bot, Volume2, AlertCircle, RefreshCw } from 'lucide-react';
import { LanguageToggle } from './LanguageToggle';
import { AudioLanguageProvider, useAudioLanguage } from './AudioLanguageContext';

interface ErrorState {
    hasError: boolean;
    message: string;
    lastInput: string;
}

// Inner component to use the context
function ChatInterfaceContent() {
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useUIState<typeof AI>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { submitUserMessage } = useActions() as { submitUserMessage: (content: string) => Promise<any> };
    const [isListening, setIsListening] = useState(false);
    const { language, setLanguage } = useAudioLanguage();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<ErrorState>({ hasError: false, message: '', lastInput: '' });

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, scrollToBottom]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const sendMessage = async (value: string) => {
        if (!value.trim() || isLoading) return;

        setInputValue('');
        setIsLoading(true);
        setError({ hasError: false, message: '', lastInput: '' });

        // Add user message to UI
        const userMessageId = Date.now();
        setMessages((currentMessages) => [
            ...currentMessages,
            {
                id: userMessageId,
                display: (
                    <div className="flex justify-end mb-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-end gap-3 max-w-[85%]">
                            <div className="bg-emerald-600 text-white px-5 py-3.5 rounded-2xl rounded-br-sm shadow-md text-lg leading-relaxed">
                                {value}
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 border border-emerald-200">
                                <User className="w-6 h-6 text-emerald-700" />
                            </div>
                        </div>
                    </div>
                ),
            },
        ]);

        try {
            // Call server action
            const response = await submitUserMessage(value);

            // Add assistant response to UI
            setMessages((currentMessages) => [
                ...currentMessages,
                {
                    id: response.id,
                    display: (
                        <div className="flex justify-start mb-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-start gap-3 max-w-[90%]">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-slate-200 shadow-sm mt-1">
                                    <Bot className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div className="bg-white text-slate-800 px-6 py-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-200 text-lg leading-relaxed">
                                    {response.display}
                                </div>
                            </div>
                        </div>
                    ),
                },
            ]);
        } catch (err) {
            console.error('Chat error:', err);
            setError({
                hasError: true,
                message: err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.',
                lastInput: value
            });
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        await sendMessage(inputValue);
    };

    const handleRetry = async () => {
        if (error.lastInput) {
            await sendMessage(error.lastInput);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !isLoading && inputValue.trim()) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const startListening = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'fr-FR';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            setIsListening(true);
            setError({ hasError: false, message: '', lastInput: '' });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
                setIsListening(false);
                // Auto-focus to input after getting result
                inputRef.current?.focus();
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
                if (event.error !== 'aborted') {
                    setError({
                        hasError: true,
                        message: 'La reconnaissance vocale a échoué. Essayez de nouveau ou tapez votre message.',
                        lastInput: ''
                    });
                }
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.start();
        } else {
            setError({
                hasError: true,
                message: "La reconnaissance vocale n'est pas supportée par ce navigateur.",
                lastInput: ''
            });
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setInputValue(suggestion);
        inputRef.current?.focus();
    };

    return (
        <div className="flex flex-col h-[calc(100vh-220px)] min-h-[500px] bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 ring-1 ring-slate-200/50 overflow-hidden relative">
            {/* Chat Header */}
            <div className="bg-white/90 backdrop-blur-md p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse absolute -right-0.5 -top-0.5 border-2 border-white"></div>
                        <Volume2 className="w-6 h-6 text-slate-600" />
                    </div>
                    <span className="font-semibold text-slate-700">Assistant Vocal</span>
                </div>
                <LanguageToggle value={language} onChange={setLanguage} />
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 scroll-smooth">
                {messages.length === 0 && (
                    <div className="flex mt-10 flex-col items-center justify-center h-full text-center p-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                            <Mic className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-3">Besoin d&apos;aide ?</h3>
                        <p className="text-slate-500 text-lg max-w-md mb-8">
                            Appuyez sur le micro et parlez, ou écrivez votre question ci-dessous.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                            {[
                                { icon: "💰", text: "Je veux retirer ma pension" },
                                { icon: "📱", text: "Ma pension est-elle disponible ?" },
                                { icon: "❓", text: "Comment ça marche ?" },
                                { icon: "📞", text: "Quel numéro utiliser ?" }
                            ].map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSuggestionClick(suggestion.text)}
                                    className="flex items-center gap-3 px-5 py-4 bg-white border border-slate-200 rounded-xl text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-sm font-medium shadow-sm hover:shadow-md group"
                                >
                                    <span className="text-2xl group-hover:scale-110 transition-transform">{suggestion.icon}</span>
                                    <span className="text-left">{suggestion.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <div key={message.id}>
                        {message.display}
                    </div>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex justify-start mb-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-3 bg-white px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-200">
                            <div className="flex space-x-1.5">
                                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-slate-500 font-medium">Je réfléchis...</span>
                        </div>
                    </div>
                )}

                {/* Error Message with Retry */}
                {error.hasError && (
                    <div className="flex justify-start mb-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-start gap-3 max-w-[90%]">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 border border-red-200 mt-1">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="bg-red-50 text-red-800 px-6 py-4 rounded-2xl rounded-tl-sm shadow-sm border border-red-200 text-lg">
                                <p className="mb-3">{error.message}</p>
                                {error.lastInput && (
                                    <button
                                        onClick={handleRetry}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Réessayer
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-white border-t border-slate-100">
                <form onSubmit={handleSubmit} className="flex gap-3 md:gap-4 items-center max-w-4xl mx-auto">
                    <button
                        type="button"
                        onClick={startListening}
                        disabled={isLoading}
                        className={`p-4 rounded-full transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isListening
                            ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                        title="Parler"
                        aria-label="Activer la reconnaissance vocale"
                    >
                        <Mic size={24} />
                    </button>

                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Posez votre question ici..."
                            className="w-full bg-slate-100 border-2 border-transparent rounded-2xl px-6 py-4 text-lg focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400"
                            disabled={isLoading}
                            aria-label="Message"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 hover:scale-105 active:scale-95"
                        title="Envoyer"
                        aria-label="Envoyer le message"
                    >
                        <Send size={24} />
                    </button>
                </form>
            </div>
        </div>
    );
}

export function ChatInterface() {
    return (
        <AudioLanguageProvider>
            <ChatInterfaceContent />
        </AudioLanguageProvider>
    );
}

