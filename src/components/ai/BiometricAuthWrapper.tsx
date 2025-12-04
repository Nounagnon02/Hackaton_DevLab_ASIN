'use client';

import { BiometricAuth } from './BiometricAuth';
import { useActions, useUIState } from '@ai-sdk/rsc';

export function BiometricAuthWrapper() {
    const { submitUserMessage } = useActions();
    const [, setMessages] = useUIState();

    const handleSuccess = async (pensioner: any) => {
        // Send authenticated context to AI
        const systemMessage = `SYSTEM: User authenticated as ${pensioner.name}. Pensioner ID: ${pensioner.id}, Balance: ${pensioner.monthlyPension} FCFA, Status: ${pensioner.paymentStatus}`;

        // Submit the authentication result
        const response = await submitUserMessage(systemMessage);
        setMessages((currentMessages: any) => [...currentMessages, response]);
    };

    return <BiometricAuth onSuccess={handleSuccess} />;
}
