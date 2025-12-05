import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mojaloopClient } from '@/lib/mojaloop-client';
import { simulateCallback } from '@/lib/callback-simulator';

export async function POST(request: Request) {
    try {
        // PHASE 1: GOVERNMENT BULK PAYMENT
        // Pay ALL pensioners who are NOT_PAID
        const pensionersToPay = await prisma.pensioner.findMany({
            where: { paymentStatus: 'NOT_PAID' }
        });

        if (pensionersToPay.length === 0) {
            return NextResponse.json(
                { error: 'No pensioners found to pay (all already paid or none exist).' },
                { status: 400 }
            );
        }

        // Get a Bulk Quote from Mojaloop
        const quote = await mojaloopClient.getBulkQuote(pensionersToPay);

        // Execute Bulk Transfer to BioPension Escrow Accounts
        const transferResult = await mojaloopClient.executeBulkTransfer(quote.bulkQuoteId, pensionersToPay);

        if (transferResult.success || transferResult.mockSuccess) {
            const bulkTransferId = transferResult.bulkTransferId || crypto.randomUUID();

            // 1. Create Transfer Record in DB (PENDING)
            await prisma.transfer.create({
                data: {
                    mojaloopId: bulkTransferId,
                    type: 'BULK',
                    status: 'PENDING',
                    amount: quote.totalAmount,
                }
            });

            // 2. Trigger Async Callback Simulation
            simulateCallback('BULK', bulkTransferId, true);

            // 3. Return 202 Accepted immediately
            return NextResponse.json({
                success: true,
                message: `Payment initiated. Processing ${pensionersToPay.length} payments in background.`,
                details: {
                    status: "PENDING",
                    bulkTransferId: bulkTransferId,
                    info: "You will be notified via callback when completed."
                }
            }, { status: 202 });

        } else {
            return NextResponse.json(
                { error: 'Failed to execute bulk transfer via Mojaloop' },
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
