'use server';

import { createAI, getMutableAIState, streamUI } from '@ai-sdk/rsc';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { BiometricAuthWrapper } from '@/components/ai/BiometricAuthWrapper';
import { z } from 'zod';
import { ReactNode } from 'react';
import { MessageAudioButton } from '@/components/ai/MessageAudioButton';

const google = createGoogleGenerativeAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.GOOGLE_API_KEY,
});

// --- UI Components ---

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

export async function submitUserMessage(content: string): Promise<{ id: number; display: ReactNode }> {
    'use server';

    const aiState = getMutableAIState<typeof AI>();

    // Handle authentication response from BiometricAuthWrapper
    if (content.startsWith('AUTHENTICATED:')) {
        const parts = content.replace('AUTHENTICATED:', '').split('|');
        if (parts.length >= 4) {
            const [name, id, monthlyPension, paymentStatus] = parts;
            const phoneNumber = parts[4] || ''; // Phone number might be in 5th position

            const pensionerData = {
                id,
                name,
                phoneNumber,
                monthlyPension: parseFloat(monthlyPension),
                paymentStatus
            };

            // Use done() to persist state properly between requests
            aiState.done({
                ...aiState.get(),
                currentPensioner: pensionerData,
                messages: [
                    ...aiState.get().messages,
                    {
                        id: Date.now().toString(),
                        role: 'system',
                        content: `AUTHENTICATED_USER: ${name} (ID: ${id}, Balance: ${monthlyPension} FCFA, Phone: ${phoneNumber})`,
                    },
                ],
            });

            const text = `Bonjour ${name} ! Votre pension de ${parseFloat(monthlyPension).toLocaleString()} FCFA est disponible. Voulez-vous la retirer vers votre numéro ${phoneNumber} ? (Oui/Non)`;

            return {
                id: Date.now(),
                display: (
                    <div>
                        <div>{text}</div>
                        <div className="mt-2">
                            <MessageAudioButton text={text} />
                        </div>
                    </div>
                )
            };
        }
    }

    // Add user message to history
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
    const isAuthenticated = currentState.messages.some(
        (m) => m.content && m.content.startsWith('AUTHENTICATED_USER:')
    );
    const pensionerName = currentState.currentPensioner?.name || '';
    const pensionerBalance = currentState.currentPensioner?.monthlyPension || 0;
    const pensionerPhone = currentState.currentPensioner?.phoneNumber || '';

    // DEBUG LOGGING
    console.log('=== STATE DEBUG ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('pensionerPhone:', pensionerPhone);
    console.log('pensionerBalance:', pensionerBalance);
    console.log('==================');

    // System prompt - SIMPLIFIED: Auth → Amount → Payment
    let systemPrompt = '';

    if (!isAuthenticated) {
        systemPrompt = `Vous êtes l'assistant GBÈDAGBÉ pour les retraités béninois.

STATUT: Utilisateur NON authentifié.

ACTIONS:
- Si l'utilisateur demande sa pension/retrait → Appelez requestBiometricAuth
- Si question générale → Répondez en texte

Soyez bienveillant et patient.`;
    } else {
        // Authenticated - just ask yes/no for withdrawal
        systemPrompt = `Vous êtes l'assistant GBÈDAGBÉ.

STATUT: ${pensionerName} est AUTHENTIFIÉ.
SOLDE DISPONIBLE: ${pensionerBalance} FCFA
NUMÉRO MOBILE MONEY: ${pensionerPhone}

FLUX ULTRA-SIMPLE:
1. Demander confirmation → 2. Transférer TOUT le solde

INSTRUCTIONS:
- Si l'utilisateur n'a pas encore confirmé:
  → Demandez: "Voulez-vous retirer vos ${pensionerBalance} FCFA vers votre numéro ${pensionerPhone} ? (Oui/Non)"

- Si l'utilisateur dit OUI, D'ACCORD, OK, JE CONFIRME, RETIRER, ou toute affirmation:
  → Appelez IMMÉDIATEMENT confirmWithdrawal(amount=${pensionerBalance}, phoneNumber="${pensionerPhone}")

- Si l'utilisateur dit NON ou annule:
  → Répondez poliment et proposez de l'aide

⚠️ NE JAMAIS demander le montant - c'est TOUJOURS ${pensionerBalance} FCFA (le solde complet)
⚠️ NE JAMAIS redemander l'authentification!`;
    }

    const result = await streamUI({
        model: google(process.env.OPENAI_MODEL_NAME || 'gemini-1.5-flash'),
        messages: [
            {
                role: 'system',
                content: systemPrompt,
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...aiState.get().messages.map((info: any) => ({
                role: info.role,
                content: info.content,
            })),
        ],
        text: ({ content, done }) => {
            if (done) {
                aiState.update({
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
                description: 'Demander l\'authentification par PIN. NE PAS utiliser si l\'utilisateur est déjà authentifié.',
                inputSchema: z.object({}),
                generate: async () => {
                    const currentState = aiState.get() as AIState;
                    const alreadyAuth = currentState.messages.some(
                        (m) => m.content && m.content.startsWith('AUTHENTICATED_USER:')
                    );

                    if (alreadyAuth) {
                        return (
                            <div className="p-3 bg-red-50 text-red-900 rounded-lg border border-red-200">
                                <p className="font-bold">❌ Erreur: L&apos;utilisateur est déjà authentifié!</p>
                            </div>
                        );
                    }

                    const text = "Veuillez vous authentifier avec votre numéro et code PIN.";
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
            confirmWithdrawal: {
                description: 'Exécuter le retrait. Appelez dès que vous avez le numéro ET le montant.',
                inputSchema: z.object({
                    amount: z.number().describe('Montant à retirer'),
                    phoneNumber: z.string().describe('Numéro Mobile Money (8 chiffres)'),
                }),
                generate: async ({ amount, phoneNumber }) => {
                    const currentState = aiState.get() as AIState;
                    const pensionerId = currentState.currentPensioner?.id;

                    if (!pensionerId) {
                        const errorText = 'Erreur: Utilisateur non authentifié.';
                        return (
                            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-red-700">{errorText}</p>
                                <div className="mt-2">
                                    <MessageAudioButton text={errorText} />
                                </div>
                            </div>
                        );
                    }

                    // Clean phone number (keep last 8 digits)
                    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-8);
                    const txId = `PEN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

                    try {
                        // Use the proxy server to call the SDK
                        const response = await fetch('http://localhost:3001/transfers', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                from: {
                                    displayName: 'Government Pension Fund',
                                    idType: 'MSISDN',
                                    idValue: '123456789'
                                },
                                to: {
                                    idType: 'MSISDN',
                                    idValue: cleanPhone
                                },
                                amountType: 'SEND',
                                currency: 'XOF',
                                amount: String(amount),
                                transactionType: 'TRANSFER',
                                note: `Pension withdrawal - ${pensionerId}`,
                                homeTransactionId: txId
                            })
                        });

                        const data = await response.json();

                        if (!response.ok) {
                            throw new Error(data.error || data.message || 'Erreur lors du transfert');
                        }

                        const transferId = data.transferId || txId;
                        const text = `✅ Retrait de ${amount.toLocaleString()} FCFA initié vers ${cleanPhone}. Référence: ${transferId}`;

                        aiState.update({
                            ...aiState.get(),
                            messages: [
                                ...aiState.get().messages,
                                {
                                    id: Date.now().toString(),
                                    role: 'assistant',
                                    content: text,
                                },
                            ],
                        });


                        return (
                            <div>
                                <TransactionReceipt id={data.transferId} amount={amount} />
                                <div className="mt-2">
                                    <MessageAudioButton text={text} />
                                </div>
                            </div>
                        );
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } catch (error: any) {
                        const errorText = `Erreur: ${error.message}`;
                        return (
                            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-red-700">{errorText}</p>
                                <div className="mt-2">
                                    <MessageAudioButton text={errorText} />
                                </div>
                            </div>
                        );
                    }
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
    }>;
    currentPensioner?: {
        id: string;
        name: string;
        phoneNumber: string;
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
