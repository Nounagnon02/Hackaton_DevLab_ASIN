import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const mojaloopId = id;
        const body = await request.json();
        const { status } = body; // e.g., "COMPLETED"

        console.log(`Received callback for Individual Transfer ${mojaloopId}: ${status}`);

        // Update the Transfer record
        const transfer = await prisma.transfer.update({
            where: { mojaloopId },
            data: { status },
        });

        if (status === 'COMPLETED' && transfer.pensionerId) {
            // Mark the pensioner as WITHDRAWN
            await prisma.pensioner.update({
                where: { id: transfer.pensionerId },
                data: { paymentStatus: 'WITHDRAWN' },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error processing transfer callback:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
