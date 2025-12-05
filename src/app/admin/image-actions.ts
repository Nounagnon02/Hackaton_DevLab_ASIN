'use server';

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const google = createGoogleGenerativeAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.GOOGLE_API_KEY,
});

const PensionerSchema = z.object({
    type_id: z.string().describe("Type of ID (e.g., PERSONAL_ID, PHONE)"),
    valeur_id: z.string().describe("ID value (e.g., phone number, national ID)"),
    devise: z.string().describe("Currency code (e.g., XOF)"),
    montant: z.string().describe("Amount to pay"),
    nom_complet: z.string().describe("Full name of the pensioner"),
});

const PensionerListSchema = z.object({
    pensioners: z.array(PensionerSchema),
});

export async function analyzePensionerImage(formData: FormData) {
    try {
        const imageFile = formData.get('image') as File;

        if (!imageFile) {
            return { success: false, error: 'No image provided' };
        }

        const arrayBuffer = await imageFile.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');

        const model = google(process.env.OPENAI_MODEL_NAME || 'gemini-2.5-flash');

        const result = await generateObject({
            model,
            schema: PensionerListSchema,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Extract the list of pensioners from this image. For each row, identify the ID type (usually PERSONAL_ID or PHONE), the ID value, the currency (default to XOF if missing), the amount, and the full name. Return a JSON list.' },
                        { type: 'image', image: base64Image }
                    ]
                }
            ]
        });

        return { success: true, data: result.object.pensioners };

    } catch (error) {
        console.error('Image analysis error:', error);
        return { success: false, error: 'Failed to analyze image' };
    }
}
