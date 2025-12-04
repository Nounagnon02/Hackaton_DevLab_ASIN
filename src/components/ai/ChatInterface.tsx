'use client';

import { useState } from 'react';
import { useUIState, useActions } from '@ai-sdk/rsc';
import type { AI } from '@/app/actions';
import { Mic, Send } from 'lucide-react';
import { LanguageToggle, type AudioLanguage } from './LanguageToggle';
import { MessageAudioButton } from './MessageAudioButton';

import { AudioLanguageProvider, useAudioLanguage } from './AudioLanguageContext';

// Helper to extract text content from React element
function extractTextFromDisplay(display: any): string {
    if (display === null || display === undefined || display === false || display === true) return '';

    // Check for data-tts-text prop first
    if (display.props && display.props['data-tts-text']) {
        return display.props['data-tts-text'];
    }

    if (typeof display === 'string') return display;
    if (typeof display === 'number') return String(display);

    if (Array.isArray(display)) {
        return display.map(extractTextFromDisplay).join(' ');
    }

    // For React elements
    if (display.props) {
        return extractTextFromDisplay(display.props.children);
    }

    return '';
}

// Extended message type with role
interface ChatMessage {
    id: number;
    display: React.ReactNode;
    role?: 'user' | 'assistant';
}

// Inner component to use the context
function ChatInterfaceContent() {
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useUIState<typeof AI>();
    const { submitUserMessage } = useActions() as { submitUserMessage: (content: string) => Promise<any> };
    const [isListening, setIsListening] = useState(false);
    const { language, setLanguage } = useAudioLanguage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        // Add user message to UI
        setMessages((currentMessages) => [
            ...currentMessages,
            {
                id: Date.now(),
                display: (
                    <div className="flex justify-end mb-4">
                        <div className="bg-emerald-600 text-white px-4 py-2 rounded-2xl rounded-tr-none max-w-[80%]">
                            {inputValue}
                        </div>
                    </div>
                ),
            },
        ]);

        const value = inputValue;
        setInputValue('');

        // Call server action
        const response = await submitUserMessage(value);

        // Add assistant response to UI
        setMessages((currentMessages) => [
            ...currentMessages,
            {
                id: response.id,
                display: (
                    <div className="flex justify-start mb-4">
                        <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl rounded-tl-none max-w-[90%]">
                            {response.display}
                        </div>
                    </div>
                ),
            },
        ]);
    };

    const startListening = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'fr-FR';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            setIsListening(true);

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.start();
        } else {
            alert("La reconnaissance vocale n'est pas supportée par ce navigateur.");
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <div className="bg-emerald-700 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <h2 className="font-bold">Assistant BioPension</h2>
                </div>
                <LanguageToggle value={language} onChange={setLanguage} />
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 mt-20">
                        <p>Bonjour ! Je suis votre assistant.</p>
                        <p className="text-sm">Demandez-moi : "Est-ce que ma pension est arrivée ?"</p>
                    </div>
                )}
                {messages.map((message) => (
                    <div key={message.id}>
                        {message.display}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100 flex gap-2">
                <button
                    type="button"
                    onClick={startListening}
                    className={`p-3 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    <Mic size={20} />
                </button>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Posez votre question..."
                    className="flex-1 bg-gray-100 border-0 rounded-full px-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={20} />
                </button>
            </form>
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
