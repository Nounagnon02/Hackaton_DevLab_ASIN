'use client';

import { PinAuth } from './PinAuth';
import { useActions, useUIState } from '@ai-sdk/rsc';

export function BiometricAuthWrapper() {
    const { submitUserMessage } = useActions();
    const [, setMessages] = useUIState();

    const handleSuccess = async (pensioner: any) => {
        // Send authenticated context to AI with structured format including phoneNumber
        const systemMessage = `AUTHENTICATED:${pensioner.name}|${pensioner.id}|${pensioner.monthlyPension}|${pensioner.paymentStatus}|${pensioner.phoneNumber}`;

        // Submit the authentication result
        const response = await submitUserMessage(systemMessage);
        setMessages((currentMessages: any) => [...currentMessages, response]);
    };

    return <PinAuth onSuccess={handleSuccess} />;
}
