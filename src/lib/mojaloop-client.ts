import axios from 'axios';

const MOJALOOP_BASE_URL = 'http://localhost:4040'; // TTK URL

const client = axios.create({
    baseURL: MOJALOOP_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

export const mojaloopClient = {
    // Simulate getting a quote for a bulk payment
    getBulkQuote: async (pensioners: any[]) => {
        // In a real scenario, we would send a POST /bulkQuotes
        // For this prototype, we'll simulate a successful quote response
        // based on the input list.

        const totalAmount = pensioners.reduce((sum, p) => sum + p.monthlyPension, 0);

        return {
            bulkQuoteId: crypto.randomUUID(),
            individualQuotes: pensioners.map(p => ({
                partyId: p.phoneNumber,
                amount: p.monthlyPension,
                currency: "XOF",
                fees: 0
            })),
            totalAmount: totalAmount,
            expiration: new Date(Date.now() + 3600000).toISOString() // 1 hour
        };
    },

    // Execute the bulk transfer
    executeBulkTransfer: async (bulkQuoteId: string, pensioners: any[]) => {
        const bulkTransferId = crypto.randomUUID();

        const payload = {
            bulkTransferId: bulkTransferId,
            bulkQuoteId: bulkQuoteId,
            payerFsp: "testfsp",
            payeeFsp: "payeefsp",
            expiration: new Date(Date.now() + 3600000).toISOString(), // 1 hour expiration
            individualTransfers: pensioners.map(p => ({
                transferId: crypto.randomUUID(),
                amount: p.monthlyPension.toString(),
                currency: "XOF",
                // ILP Packet: Required by Mojaloop FSPIOP spec (using a dummy valid base64 packet for prototype)
                ilpPacket: "AYIBgQAAAAAAAASwNGxldmVsb25lLmRmc3AxLm1lci45T2RTOF81MDdqUUZERmZlakgyOVc4bXFmNEpLMHlGTFGCAUBQU0svMS4wCk5vbmNlOiB1SXlweUYzY3pYSXBFdzVVc05TYWh3CkVuY3J5cHRpb246IG5vbmUKUGF5bWVudC1JZDogMTIzNDU2Nzg5MAoKQ29udGVudC1MZW5ndGg6IDEzNQpDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb24KU2VuZGVyLUlkZW50aWZpZXI6IDkyODA2MzkxCgp7CiAgImZlZSI6IDAsCiAgInRyYW5zZmVySWQiOiAiMDJlMjhmNzctNWE2Yi00ZGRkLWE3NTMtZTQyNjQwY2MwNDcxIiwKICAiY3VycmVuY3kiOiAiVVNEIiwKICAiYW1vdW50IjogIjIwMCIsCiAgImxlZGdlcklkcyI6IHsiZmlyc3QiOiIxIn0KfQ",
                // Condition: SHA-256 hash (dummy valid condition for prototype)
                condition: "f5sqb7tBTWPd5Y8BDFdMm9BJR_MNI4isf8p8n4D5pHA",
                payeeFsp: p.fspId,
                payerFsp: "testfsp"
            }))
        };

        try {
            // We are sending this to the TTK. 
            // Note: The TTK might need specific rules to handle /bulkTransfers if we want a "real" 202.
            // For now, we assume the TTK or our mock rules will accept it.
            // If the TTK doesn't support bulkTransfers out of the box without rules, 
            // we might get a 404 or 501. 
            // In that case, we might need to add a rule or mock this call entirely if the TTK is limited.
            // Let's try to hit the endpoint.
            const response = await client.post('/bulkTransfers', payload);
            return { success: true, data: response.data, bulkTransferId };
        } catch (error: any) {
            console.error("Mojaloop Bulk Transfer Error:", error.message);
            // Fallback for prototype if TTK isn't fully configured for Bulk
            return { success: false, error: error.message, mockSuccess: true };
        }
    },

    // Execute a single transfer (for individual withdrawal)
    executeSingleTransfer: async (params: {
        pensionerId: string;
        phoneNumber: string;
        amount: number;
        fspId: string;
    }) => {
        const transferId = crypto.randomUUID();

        const payload = {
            transferId: transferId,
            payerFsp: "testfsp", // BioPension escrow account
            payeeFsp: params.fspId,
            amount: {
                currency: "XOF",
                amount: params.amount.toString()
            },
            to: {
                idType: "MSISDN",
                idValue: params.phoneNumber
            }
        };

        try {
            // POST /transfers to Mojaloop
            const response = await client.post('/transfers', payload);
            return { success: true, data: response.data, transferId };
        } catch (error: any) {
            console.error("Mojaloop Single Transfer Error:", error.message);
            // Fallback for prototype
            return { success: false, error: error.message, mockSuccess: true, transferId };
        }
    }
};
