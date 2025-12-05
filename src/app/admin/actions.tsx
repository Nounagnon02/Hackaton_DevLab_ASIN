'use server';

import { createAI, getMutableAIState, streamUI } from '@ai-sdk/rsc';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { ReactNode } from 'react';

const google = createGoogleGenerativeAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.GOOGLE_API_KEY,
});

import { CSVUploadWidget } from '@/components/admin/CSVUploadWidget';

// --- Server Action ---
async function submitAdminMessage(content: string): Promise<{ id: number; display: ReactNode }> {
    'use server';

    const aiState = getMutableAIState<typeof AI>();

    aiState.update({
        ...aiState.get(),
        messages: [
            ...aiState.get().messages,
            { id: Date.now().toString(), role: 'user', content }
        ]
    });

    const result = await streamUI({
        model: google(process.env.OPENAI_MODEL_NAME || 'gemini-1.5-flash'),
        system: `Tu es PayBot, un assistant IA spécialisé dans les paiements de masse de pensions via Mojaloop.

Tu aides les administrateurs à :
- Charger et analyser des fichiers CSV de paiements
- Détecter les erreurs et anomalies dans les données
- Guider le processus de paiement de masse

RÈGLES:
1. Quand l'utilisateur veut faire un paiement de masse, propose IMMÉDIATEMENT le composant d'upload CSV avec showCSVUpload
2. Ne demande PAS de détails avant
3. Sois concis`,
        messages: aiState.get().messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content
        })),
        text: ({ content, done }) => {
            if (done) {
                aiState.done({
                    ...aiState.get(),
                    messages: [
                        ...aiState.get().messages,
                        { id: Date.now().toString(), role: 'assistant', content }
                    ]
                });
            }
            return (
                <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed">{content}</p>
                </div>
            );
        },
        tools: {
            showCSVUpload: {
                description: 'Affiche le composant pour uploader un fichier CSV de paiements',
                parameters: z.object({}),
                generate: async function* () {
                    yield (
                        <div className="inline-block bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium mb-3">
                            📋 Prêt pour l'upload
                        </div>
                    );
                    return <CSVUploadWidget />;
                }
            }
        }
    });

    return {
        id: Date.now(),
        display: result.value
    };
}

// --- AI State ---
type AIState = {
    chatId: string;
    messages: Array<{
        id: string;
        role: 'user' | 'assistant' | 'system';
        content: string;
    }>;
};

type UIState = Array<{
    id: number;
    display: ReactNode;
}>;

export const AI = createAI<AIState, UIState>({
    actions: {
        submitAdminMessage,
    },
    initialAIState: {
        chatId: 'admin-chat',
        messages: [],
    },
    initialUIState: [],
});
