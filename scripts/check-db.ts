import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const pensioners = await prisma.pensioner.findMany();
    console.log(JSON.stringify(pensioners, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
