import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const pensioners = await prisma.pensioner.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(pensioners);
    } catch (error) {
        console.error('Error fetching pensioners:', error);
        return NextResponse.json(
            { error: 'Failed to fetch pensioners' },
            { status: 500 }
        );
    }
}
