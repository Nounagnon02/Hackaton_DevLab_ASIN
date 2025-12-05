import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        // Determine RP ID based on environment/request
        // Priority: Env Var -> Host header -> localhost fallback
        const host = req.headers.get('host') || 'localhost';
        const rpID = process.env.WEBAUTHN_RP_ID || host.split(':')[0];

        const options = await generateAuthenticationOptions({
            rpID,
            userVerification: 'preferred',
            allowCredentials: [], // Allow any registered credential for this RP
        });

        // In a real app, save challenge to session/DB
        // For this prototype, we pass it back to client to send to verify

        return NextResponse.json(options);

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
