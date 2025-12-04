import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Clear existing data
    await prisma.transfer.deleteMany()
    await prisma.pensioner.deleteMany()

    // Create pensioners
    const pensioners = await Promise.all([
        prisma.pensioner.create({
            data: {
                name: 'Jean Atchadé',
                phoneNumber: '22997000000',
                monthlyPension: 50000,
                paymentStatus: 'NOT_PAID',
                fspId: 'payeefsp',
            },
        }),
        prisma.pensioner.create({
            data: {
                name: 'Marie Kossou',
                phoneNumber: '22961000000',
                monthlyPension: 45000,
                paymentStatus: 'NOT_PAID',
                fspId: 'payeefsp',
            },
        }),
        prisma.pensioner.create({
            data: {
                name: 'Paul Hounkponou',
                phoneNumber: '22996000000',
                monthlyPension: 60000,
                paymentStatus: 'NOT_PAID',
                fspId: 'payeefsp',
            },
        }),
    ])

    console.log('✅ Seed completed!')
    console.log(`Created ${pensioners.length} pensioners`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
