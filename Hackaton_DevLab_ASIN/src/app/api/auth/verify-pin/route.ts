import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { phoneNumber, pin } = await req.json();
        console.log('Received phone:', phoneNumber, 'PIN:', pin);

        if (!phoneNumber || !pin) {
            return NextResponse.json(
                { success: false, error: 'Numéro et PIN requis' },
                { status: 400 }
            );
        }

        // Find pensioner by phone number AND PIN
        const pensioner = await prisma.pensioner.findFirst({
            where: {
                phoneNumber: String(phoneNumber),
                pin: String(pin)
            }
        });
        console.log('Found pensioner:', pensioner ? pensioner.name : 'none');

        if (!pensioner) {
            return NextResponse.json(
                { success: false, error: 'PIN incorrect' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            pensioner: {
                id: pensioner.id,
                name: pensioner.name,
                phoneNumber: pensioner.phoneNumber,
                monthlyPension: pensioner.monthlyPension,
                paymentStatus: pensioner.paymentStatus
            }
        });

    } catch (error) {
        console.error('PIN verification error:', error);
        return NextResponse.json(
            { success: false, error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
