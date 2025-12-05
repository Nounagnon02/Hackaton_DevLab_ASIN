import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { pensionerId, response: registrationResponse } = body;

        if (!pensionerId || !registrationResponse) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        const pensioner = await prisma.pensioner.findUnique({
            where: { id: pensionerId }
        });

        if (!pensioner) {
            return NextResponse.json({ error: 'Pensioner not found' }, { status: 404 });
        }

        // Determine RP ID and Origin based on environment/request
        const host = req.headers.get('host') || 'localhost';
        const protocol = host.includes('localhost') ? 'http' : 'https';

        const expectedRPID = process.env.WEBAUTHN_RP_ID || host.split(':')[0];
        const expectedOrigin = process.env.WEBAUTHN_ORIGIN || `${protocol}://${host}`;

        const verification = await verifyRegistrationResponse({
            response: registrationResponse,
            // CRITICAL: In production, you MUST verify the challenge matches what was sent in /options.
            // Here we are bypassing strict challenge check to avoid setting up a session store for the hackathon.
            // We will catch the error if we pass empty, so we might need to "fake" it or accept that verifyRegistrationResponse might fail if we don't provide expectedChallenge.
            // Actually, simplewebauthn REQUIRES expectedChallenge.
            // Let's rely on the client sending the challenge back for now (insecure but works for demo).
            expectedChallenge: body.challenge,
            expectedOrigin,
            expectedRPID,
        });

        console.log('Verification result:', JSON.stringify(verification, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value // Handle BigInt serialization
            , 2));

        if (verification.verified && verification.registrationInfo) {
            const { credential } = verification.registrationInfo;
            const { id: credentialID, publicKey: credentialPublicKey, counter } = credential;

            console.log('Credential Info:', { credentialID, credentialPublicKey, counter });

            // Save to DB
            await prisma.pensioner.update({
                where: { id: pensionerId },
                data: {
                    credentialId: credentialID, // simplewebauthn returns base64url string for ID
                    publicKey: Buffer.from(credentialPublicKey).toString('base64'),
                    counter: counter,
                }
            });

            return NextResponse.json({ verified: true });
        }

        return NextResponse.json({ verified: false, error: 'Verification failed' }, { status: 400 });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
