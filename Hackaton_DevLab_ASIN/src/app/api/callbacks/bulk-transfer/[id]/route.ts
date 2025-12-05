import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Next.js 16: params is now a Promise
        const { id } = await params;
        const mojaloopId = id;

        const body = await request.json();
        const { status } = body; // e.g., "COMPLETED", "FAILED"

        console.log(`[CALLBACK] Received callback for Bulk Transfer ${mojaloopId}: ${status}`);

        // Update the Transfer record
        const transfer = await prisma.transfer.update({
            where: { mojaloopId },
            data: { status },
        });

        console.log(`[CALLBACK] Transfer record updated: ${transfer.id}`);

        if (status === 'COMPLETED') {
            // Logic: If bulk payment is completed, mark all NOT_PAID pensioners as AVAILABLE
            // In a real system, we would link specific pensioners to this bulk transfer.
            // For this prototype, we assume the bulk transfer covers all eligible pensioners.
            const result = await prisma.pensioner.updateMany({
                where: { paymentStatus: 'NOT_PAID' },
                data: { paymentStatus: 'AVAILABLE' },
            });

            console.log(`[CALLBACK] ✅ Marked ${result.count} pensioners as AVAILABLE`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[CALLBACK] ❌ Error processing bulk callback:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
