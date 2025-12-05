import { NextResponse } from 'next/server';
import { verifyPensioner } from '@/lib/mock-db';

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

        // SIMULATION: In a real app, we would send imageBase64 to a Face ID provider.
        // Here, we assume if we receive an image, it's valid for the demo.
        // We add a small delay to simulate processing.
        await new Promise(resolve => setTimeout(resolve, 1500));

        const success = verifyPensioner(pensionerId);

        if (success) {
            return NextResponse.json({
                verified: true,
                message: 'Identity verified successfully. You are eligible for this month\'s pension.'
            });
        } else {
            return NextResponse.json(
                { error: 'Pensioner not found' },
                { status: 404 }
            );
        }

    } catch (error) {
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
