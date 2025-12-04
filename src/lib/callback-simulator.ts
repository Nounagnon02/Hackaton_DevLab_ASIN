import { prisma } from '@/lib/prisma';
import axios from 'axios';

// This helper simulates the network delay and callback from Mojaloop
export const simulateCallback = async (
    type: 'BULK' | 'INDIVIDUAL',
    mojaloopId: string,
    success: boolean = true
) => {
    // Fire and forget - don't await this in the main API response
    (async () => {
        try {
            console.log(`[SIMULATOR] Starting callback simulation for ${type} ${mojaloopId}...`);

            // 1. Simulate Network Delay (2-5 seconds)
            const delay = Math.floor(Math.random() * 3000) + 2000;
            await new Promise(resolve => setTimeout(resolve, delay));

            // 2. Determine status
            const status = success ? 'COMPLETED' : 'FAILED';

            // 3. Call our own Callback API
            // In production, Mojaloop would call this URL.
            // Here, we call localhost.
            const baseUrl = 'http://localhost:3000';
            const endpoint = type === 'BULK'
                ? `/api/callbacks/bulk-transfer/${mojaloopId}`
                : `/api/callbacks/transfer/${mojaloopId}`;

            console.log(`[SIMULATOR] Sending ${status} callback to ${endpoint}`);

            await axios.put(`${baseUrl}${endpoint}`, { status });

            console.log(`[SIMULATOR] Callback sent successfully.`);

        } catch (error) {
            console.error('[SIMULATOR] Failed to send callback:', error);
        }
    })();
};
