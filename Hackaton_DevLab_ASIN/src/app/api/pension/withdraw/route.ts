import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mojaloopClient } from '@/lib/mojaloop-client';
import { simulateCallback } from '@/lib/callback-simulator';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { pensionerId, imageBase64 } = body;

        if (!pensionerId || !imageBase64) {
            return NextResponse.json(
                { error: 'Missing pensionerId or image data' },
                { status: 400 }
            );
        }

        // Get pensioner details from DB
        const pensioner = await prisma.pensioner.findUnique({
            where: { id: pensionerId }
        });

        if (!pensioner) {
            return NextResponse.json(
                { error: 'Pensioner not found' },
                { status: 404 }
            );
        }

        // Check if payment is available
        if (pensioner.paymentStatus !== "AVAILABLE") {
            return NextResponse.json(
                { error: `Payment not available. Current status: ${pensioner.paymentStatus}` },
                { status: 400 }
            );
        }

        // BIOMETRIC VERIFICATION (Mock)
        await new Promise(resolve => setTimeout(resolve, 1500));
        const verificationSuccess = true;

        if (!verificationSuccess) {
            return NextResponse.json(
                { error: 'Biometric verification failed' },
                { status: 401 }
            );
        }

        // Execute INDIVIDUAL transfer via Mojaloop
        try {
            const transferResult = await mojaloopClient.executeSingleTransfer({
                pensionerId: pensioner.id,
                phoneNumber: pensioner.phoneNumber,
                amount: pensioner.monthlyPension,
                fspId: pensioner.fspId
            });

            if (transferResult.success || transferResult.mockSuccess) {
                const transferId = transferResult.transferId || crypto.randomUUID();

                // 1. Create Transfer Record in DB (PENDING)
                await prisma.transfer.create({
                    data: {
                        mojaloopId: transferId,
                        type: 'INDIVIDUAL',
                        status: 'PENDING',
                        amount: pensioner.monthlyPension,
                        pensionerId: pensioner.id
                    }
                });

                // 2. Trigger Async Callback Simulation
                simulateCallback('INDIVIDUAL', transferId, true);

                // 3. Return 202 Accepted
                return NextResponse.json({
                    success: true,
                    message: 'Withdrawal initiated. Transfer processing...',
                    details: {
                        amount: pensioner.monthlyPension,
                        phoneNumber: pensioner.phoneNumber,
                        transferId: transferId,
                        status: "PENDING"
                    }
                }, { status: 202 });

            } else {
                return NextResponse.json(
                    { error: 'Mojaloop transfer failed' },
                    { status: 502 }
                );
            }
        } catch (mojaloopError: any) {
            console.error('Mojaloop error:', mojaloopError);
            return NextResponse.json(
                { error: 'Payment gateway error', details: mojaloopError.message },
                { status: 502 }
            );
        }

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
