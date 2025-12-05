import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { response: authenticationResponse } = body;

        if (!authenticationResponse) {
            return NextResponse.json({ error: 'Missing response' }, { status: 400 });
        }

        // Find pensioner by credential ID
        const credentialId = authenticationResponse.id;

        // Demo mode: if using demo credential, return first pensioner
        if (credentialId === 'demo-credential-simulation') {
            const pensioner = await prisma.pensioner.findFirst();
            return NextResponse.json({
                success: true,
                pensioner: {
                    id: pensioner?.id,
                    name: pensioner?.name,
                    monthlyPension: pensioner?.monthlyPension,
                    paymentStatus: pensioner?.paymentStatus
                }
            });
        }

        // Find pensioner with this credential
        // Note: In production, you'd query by credentialId directly if it's unique across users
        // Here we assume it is.
        const pensioner = await prisma.pensioner.findUnique({
            where: { credentialId }
        });

        if (!pensioner || !pensioner.publicKey) {
            return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
        }

        // Determine RP ID and Origin based on environment/request
        const host = req.headers.get('host') || 'localhost';
        const protocol = host.includes('localhost') ? 'http' : 'https';

        const expectedRPID = process.env.WEBAUTHN_RP_ID || host.split(':')[0];
        const expectedOrigin = process.env.WEBAUTHN_ORIGIN || `${protocol}://${host}`;

        const verification = await verifyAuthenticationResponse({
            response: authenticationResponse,
            expectedChallenge: body.challenge, // From client
            expectedOrigin,
            expectedRPID,
            credential: {
                id: authenticationResponse.id,
                publicKey: Buffer.from(pensioner.publicKey, 'base64'),
                counter: pensioner.counter,
            },
        });

        if (verification.verified) {
            const { authenticationInfo } = verification;
            const { newCounter } = authenticationInfo;

            // Update counter
            await prisma.pensioner.update({
                where: { id: pensioner.id },
                data: { counter: newCounter }
            });

            return NextResponse.json({
                success: true,
                pensioner: {
                    id: pensioner.id,
                    name: pensioner.name,
                    monthlyPension: pensioner.monthlyPension,
                    paymentStatus: pensioner.paymentStatus
                }
            });
        }

        return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 400 });

    } catch (error: any) {
        console.error('Biometric verification error:', error);
        return NextResponse.json(
            { error: error.message || 'Verification failed' },
            { status: 500 }
        );
    }
}
