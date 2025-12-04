'use server';

import { createAI, getMutableAIState, streamUI } from '@ai-sdk/rsc';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { BiometricAuthWrapper } from '@/components/ai/BiometricAuthWrapper';


const google = createGoogleGenerativeAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.GOOGLE_API_KEY,
    // No baseURL needed - @ai-sdk/google uses the correct Google API endpoint
});
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ReactNode } from 'react';

// --- Generative UI Components (Server Side Definitions) ---

const PensionStatusCard = ({ balance, status }: { balance: number, status: string }) => (
    <div className="p-4 bg-white rounded-lg shadow border border-emerald-100 mt-2">
        <h3 className="font-bold text-emerald-800">État de votre Pension</h3>
        <p className="text-3xl font-bold text-emerald-600">{balance.toLocaleString()} FCFA</p>
        <p className="text-sm text-gray-500">Statut: {status}</p>
    </div>
);

const WithdrawalForm = ({ maxAmount, pensionerName }: { maxAmount: number, pensionerName?: string }) => (
    <div className="p-4 bg-white rounded-lg shadow border border-emerald-100 mt-2">
        <h3 className="font-bold text-emerald-800">Effectuer un Retrait {pensionerName ? `pour ${pensionerName}` : ''}</h3>
        <p className="text-sm text-gray-500 mb-4">Montant disponible: {maxAmount.toLocaleString()} FCFA</p>
        {/* Note: In a real app, this form would call another Server Action or be a Client Component */}
        <div className="space-y-3">
            <input type="tel" placeholder="Numéro Mobile Money" className="w-full p-2 border rounded bg-gray-50" disabled />
            <button className="w-full bg-emerald-600 text-white p-2 rounded font-bold opacity-50 cursor-not-allowed">
                Utilisez le chat pour confirmer le numéro
            </button>
            <p className="text-xs text-gray-500">Dites simplement "Je confirme le numéro 97..." pour valider.</p>
        </div>
    </div>
);

const TransactionReceipt = ({ id, amount }: { id: string, amount: number }) => (
    <div className="p-4 bg-green-50 rounded-lg border border-green-200 mt-2">
        <div className="flex items-center gap-2 text-green-700 font-bold mb-2">
            <span>✅</span> Succès
        </div>
        <p>Retrait de {amount.toLocaleString()} FCFA initié.</p>
        <p className="text-xs text-gray-500 mt-1">ID: {id}</p>
    </div>
);

// --- Server Action ---

import { MessageAudioButton } from '@/components/ai/MessageAudioButton';

// ... imports

// --- Server Action ---

export async function submitUserMessage(content: string): Promise<{ id: number; display: ReactNode }> {
    'use server';

    const aiState = getMutableAIState<typeof AI>();

    aiState.update({
        ...aiState.get(),
        messages: [
            ...aiState.get().messages,
            {
                id: Date.now().toString(),
                role: 'user',
                content,
            },
        ],
    });

    const currentState = aiState.get() as AIState;
    const currentPensioner = currentState.currentPensioner;

    const result = await streamUI({
        model: google(process.env.OPENAI_MODEL_NAME || 'gemini-1.5-flash'),
        messages: [
            // ... system prompt ...
            {
                role: 'system',
                content: `Vous êtes un assistant IA pour BioPension, plateforme de pensions au Bénin.
// ... (keep existing system prompt content) ...
`,
            },
            ...aiState.get().messages.map((info: any) => ({
                role: info.role,
                content: info.content,
                name: info.name,
            })),
        ],
        text: ({ content, done }) => {
            if (done) {
                aiState.done({
                    ...aiState.get(),
                    messages: [
                        ...aiState.get().messages,
                        {
                            id: Date.now().toString(),
                            role: 'assistant',
                            content,
                        },
                    ],
                });
            }
            return (
                <div>
                    <div>{content}</div>
                    <div className="mt-2">
                        <MessageAudioButton text={content} />
                    </div>
                </div>
            );
        },
        tools: {
            requestBiometricAuth: {
                description: 'Demander l\'authentification biométrique du retraité. Utilisez cet outil dès que l\'utilisateur demande sa pension.',
                inputSchema: z.object({}),
                generate: async () => {
                    const text = "Veuillez procéder à l'authentification biométrique pour continuer.";
                    return (
                        <div>
                            <p className="mb-2">{text}</p>
                            <BiometricAuthWrapper />
                            <div className="mt-2">
                                <MessageAudioButton text={text} />
                            </div>
                        </div>
                    );
                },
            },
            checkPensionStatus: {
                description: 'Vérifier le solde et le statut de la pension du retraité. ATTENTION: Utilisez cet outil UNIQUEMENT lors de la première demande. Si vous avez déjà le contexte du retraité, NE PAS utiliser cet outil - répondez directement en texte pour demander le numéro Mobile Money.',
                inputSchema: z.object({
                    pensionerName: z.string().optional().describe('Le nom complet du retraité (ex: "Jean Atchadé")'),
                }),
                generate: async ({ pensionerName }) => {
                    // GUARD: Prevent ANY re-calling when we already have context
                    const currentState = aiState.get() as any;
                    if (currentState.currentPensioner) {
                        // Context exists - redirect user instead of searching again
                        const existing = currentState.currentPensioner;
                        const text = `${existing.name}, nous attendons votre numéro Mobile Money pour retirer vos ${existing.monthlyPension} FCFA.`;

                        aiState.update({
                            ...aiState.get(),
                            messages: [
                                ...aiState.get().messages,
                                {
                                    id: Date.now().toString(),
                                    role: 'assistant',
                                    content: text,
                                    name: 'checkPensionStatus',
                                },
                            ],
                        });

                        return (
                            <div className="p-3 bg-amber-50 text-amber-900 rounded-lg border border-amber-200 text-sm">
                                <p className="font-bold">✋ Bonjour {existing.name} !</p>
                                <p className="mt-2">Nous attendons votre numéro Mobile Money pour retirer vos <span className="font-bold">{existing.monthlyPension.toLocaleString()} FCFA</span>.</p>
                                <p className="mt-2 text-xs bg-amber-100 p-2 rounded">💡 Dites simplement votre numéro (ex: 97123456).</p>
                                <div className="mt-2">
                                    <MessageAudioButton text={text} />
                                </div>
                            </div>
                        );
                    }

                    let pensioner;

                    if (pensionerName) {
                        // Search by name - split and search for all parts (flexible order)
                        const nameParts = pensionerName.toLowerCase().split(' ').filter(p => p.length > 0);

                        pensioner = await prisma.pensioner.findFirst({
                            where: {
                                OR: nameParts.map(part => ({
                                    name: {
                                        contains: part,
                                        mode: 'insensitive'
                                    }
                                }))
                            }
                        });
                    } else {
                        // Default: get first pensioner (demo mode)
                        pensioner = await prisma.pensioner.findFirst();
                    }

                    if (!pensioner) {
                        return <div>Erreur: Aucun dossier de retraité trouvé pour ce nom.</div>;
                    }

                    const message = `Bonjour ${pensioner.name}! Votre pension de ${pensioner.monthlyPension} FCFA est ${pensioner.paymentStatus === 'AVAILABLE' ? 'disponible' : 'pas encore disponible'}.${pensioner.paymentStatus === 'AVAILABLE' ? ' Pour procéder au retrait, quel est votre numéro Mobile Money ?' : ''}`;

                    aiState.update({
                        ...aiState.get(),
                        messages: [
                            ...aiState.get().messages,
                            {
                                id: Date.now().toString(),
                                role: 'assistant',
                                content: message,
                                name: 'checkPensionStatus',
                            },
                        ],
                        // Store current pensioner for next tool calls
                        currentPensioner: {
                            id: pensioner.id,
                            name: pensioner.name,
                            monthlyPension: pensioner.monthlyPension,
                            paymentStatus: pensioner.paymentStatus
                        }
                    });

                    return (
                        <div>
                            <PensionStatusCard balance={pensioner.monthlyPension} status={pensioner.paymentStatus} />
                            <div className="mt-4 p-3 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-100 text-sm">
                                <p>{message}</p>
                            </div>
                            <div className="mt-2">
                                <MessageAudioButton text={message} />
                            </div>
                        </div>
                    );
                },
            },
            // initiateWithdrawal tool removed to simplify flow

            confirmWithdrawal: {
                description: 'Exécuter le retrait après obtention du numéro Mobile Money. IMPORTANT: Passez le pensionerName que vous connaissez.',
                inputSchema: z.object({
                    amount: z.number(),
                    phoneNumber: z.string(),
                    pensionerName: z.string().optional().describe('Le nom du retraité pour ce retrait'),
                }),
                generate: async ({ amount, phoneNumber, pensionerName }) => {
                    const transactionId = "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase();
                    const text = `Retrait confirmé de ${amount} sur le ${phoneNumber}.`;

                    aiState.done({
                        ...aiState.get(),
                        messages: [
                            ...aiState.get().messages,
                            {
                                id: Date.now().toString(),
                                role: 'assistant',
                                content: text,
                                name: 'confirmWithdrawal',
                            },
                        ],
                    });

                    return (
                        <div>
                            <TransactionReceipt id={transactionId} amount={amount} />
                            <div className="mt-2">
                                <MessageAudioButton text={text} />
                            </div>
                        </div>
                    );
                },
            },
        },
    });

    return {
        id: Date.now(),
        display: result.value,
    };
}

// --- AI Provider ---

export type AIState = {
    chatId: string;
    messages: Array<{
        id: string;
        role: 'user' | 'assistant' | 'system';
        content: string;
        name?: string;
    }>;
    currentPensioner?: {
        id: string;
        name: string;
        monthlyPension: number;
        paymentStatus: string;
    };
};

export type UIState = Array<{
    id: number;
    display: ReactNode;
}>;

export const AI = createAI<AIState, UIState>({
    actions: {
        submitUserMessage,
    },
    initialAIState: {
        chatId: 'demo-chat',
        messages: [],
    },
    initialUIState: [],
});
