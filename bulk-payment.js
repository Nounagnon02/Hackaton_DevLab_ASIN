const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const axios = require('axios');

const prisma = new PrismaClient();
const CSV_FILE = '../sdk-ttk/resources/payment_list.csv';
const API_BASE_URL = 'http://localhost:4001';

async function processPayments() {
    try {
        const csvData = fs.readFileSync(CSV_FILE, 'utf8');
        const lines = csvData.trim().split('\n');
        
        console.log('🚀 Démarrage des paiements en masse avec Prisma...\n');
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const payment = {
                type_id: values[0],
                valeur_id: values[1],
                devise: values[2],
                montant: parseFloat(values[3]),
                nom_complet: values[4]
            };
            
            await processPaymentWithDB(payment, i);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('\n✅ Tous les paiements ont été traités !');
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

async function processPaymentWithDB(payment, index) {
    // Créer ou trouver le pensionnaire
    let pensioner = await prisma.pensioner.findUnique({
        where: { phoneNumber: payment.valeur_id }
    });
    
    if (!pensioner) {
        pensioner = await prisma.pensioner.create({
            data: {
                name: payment.nom_complet,
                phoneNumber: payment.valeur_id,
                monthlyPension: payment.montant,
                fspId: 'testingtoolkitdfsp'
            }
        });
        console.log(`👤 Nouveau pensionnaire créé: ${pensioner.name}`);
    }
    
    // Créer l'enregistrement de transfert
    const transfer = await prisma.transfer.create({
        data: {
            type: 'PENSION_PAYMENT',
            amount: payment.montant,
            pensionerId: pensioner.id,
            status: 'PENDING'
        }
    });
    
    await sendPayment(payment, index, transfer.id);
}

async function sendPayment(payment, index, transferId) {
    const transferData = {
        from: {
            displayName: "John Doe",
            idType: "MSISDN",
            idValue: "123456789"
        },
        to: {
            idType: "PERSONAL_ID",
            idValue: "22912345678"
        },
        amountType: "SEND",
        currency: "XOF",
        amount: payment.montant,
        transactionType: "TRANSFER",
        note: "testpayment",
        homeTransactionId: `test-${index}`
    };
    
    try {
        console.log(`📤 Paiement ${index}: ${payment.montant} ${payment.devise} → ${payment.nom_complet}`);
        
        const response = await axios.post(`${API_BASE_URL}/transfers`, transferData, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000
        });
        
        // Mettre à jour le statut dans la DB
        await prisma.transfer.update({
            where: { id: transferId },
            data: { 
                status: 'COMPLETED',
                mojaloopId: response.data.transferId
            }
        });
        
        console.log(`✅ Succès: ${response.data.currentState || 'SENT'}`);
    } catch (error) {
        // Mettre à jour le statut d'échec dans la DB
        await prisma.transfer.update({
            where: { id: transferId },
            data: { status: 'FAILED' }
        });
        
        const errorMsg = error.response?.data?.message || error.response?.status || error.message;
        console.log(`❌ Échec: ${errorMsg}`);
    }
}

processPayments();