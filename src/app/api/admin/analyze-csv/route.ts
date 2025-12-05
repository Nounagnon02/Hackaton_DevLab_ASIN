import { NextRequest, NextResponse } from 'next/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

const google = createGoogleGenerativeAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.GOOGLE_API_KEY,
});

// Types for Gemini analysis
type GeminiAnomaly = {
    ligne: number;
    champ: string;
    probleme: string;
    severite: 'critique' | 'moyenne' | 'faible';
};

type GeminiAnalysis = {
    bilan: string;
    anomalies: GeminiAnomaly[];
    lignesRisque: number[];
    recommandations: string[];
};

async function analyzeWithGemini(csvContent: string, technicalErrors: any[], technicalWarnings: any[]): Promise<GeminiAnalysis | null> {
    try {
        const lines = csvContent.trim().split('\n');
        // Limiter à 50 lignes pour l'analyse Gemini (coût API)
        const sampleLines = lines.slice(0, Math.min(51, lines.length)).join('\n');

        const prompt = `Tu es un expert en analyse de données financières pour des paiements de pensions via Mojaloop.

Analyse ce fichier CSV de paiements et fournis une analyse JSON structurée.

FICHIER CSV (${lines.length - 1} lignes totales, échantillon de ${Math.min(50, lines.length - 1)} lignes) :
\`\`\`
${sampleLines}
\`\`\`

ERREURS TECHNIQUES DÉTECTÉES : ${technicalErrors.length}
${technicalErrors.slice(0, 5).map((e: any) => `- Ligne ${e.line}: ${e.field} - ${e.message}`).join('\n')}

AVERTISSEMENTS TECHNIQUES : ${technicalWarnings.length}
${technicalWarnings.slice(0, 5).map((w: any) => `- Ligne ${w.line}: ${w.field} - ${w.message}`).join('\n')}

INSTRUCTIONS:
1. Analyse le contenu et la structure des données
2. Identifie les anomalies de formatage (noms suspects, montants incohérents, etc.)
3. Détecte les lignes à haut risque d'échec lors de l'envoi
4. Fournis des recommandations actionnables

RÉPONDS UNIQUEMENT avec un objet JSON valide dans ce format EXACT:
{
  "bilan": "résumé en 1-2 phrases du fichier et de sa qualité globale",
  "anomalies": [
    {"ligne": 2, "champ": "nom_complet", "probleme": "description du problème", "severite": "critique"},
    {"ligne": 5, "champ": "montant", "probleme": "description", "severite": "moyenne"}
  ],
  "lignesRisque": [2, 5, 8],
  "recommandations": ["conseil 1", "conseil 2", "conseil 3"]
}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

        const result = await generateText({
            model: google(process.env.OPENAI_MODEL_NAME || 'gemini-1.5-flash'),
            prompt,
            temperature: 0.3,
        });

        // Parser la réponse JSON
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Gemini response format invalid:', result.text);
            return null;
        }

        const analysis: GeminiAnalysis = JSON.parse(jsonMatch[0]);
        return analysis;

    } catch (error) {
        console.error('Gemini analysis error:', error);
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { csvContent, fileName } = await request.json();

        if (!csvContent) {
            return NextResponse.json({ error: 'CSV content required' }, { status: 400 });
        }

        // Parse CSV
        const lines = csvContent.trim().split('\n');
        const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());

        const errors: Array<{ line: number; field: string; message: string }> = [];
        const warnings: Array<{ line: number; field: string; message: string }> = [];
        const duplicates = new Set<string>();
        const phoneNumbers = new Set<string>();
        let totalAmount = 0;
        let validRows = 0;

        // Required columns detection
        const requiredFields = ['montant', 'valeur_id', 'nom_complet'];
        const missingFields = requiredFields.filter(field =>
            !headers.some((h: string) => h.includes(field.split('_')[0]))
        );

        if (missingFields.length > 0) {
            return NextResponse.json({
                error: `Colonnes manquantes: ${missingFields.join(', ')}`,
                success: false
            }, { status: 400 });
        }

        // Analyze each row
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // Skip empty lines

            const values = lines[i].split(',').map((v: string) => v.trim());

            if (values.length !== headers.length) {
                errors.push({
                    line: i + 1,
                    field: 'structure',
                    message: `${values.length} colonnes trouvées, ${headers.length} attendues`
                });
                continue;
            }

            const row: any = {};
            headers.forEach((h: string, j: number) => row[h] = values[j]);

            // Find phone number field (multiple possible names)
            const phoneField = row['valeur_id'] || row['telephone'] || row['phone'] || row['numero'];
            if (!phoneField) {
                errors.push({ line: i + 1, field: 'téléphone', message: 'Numéro de téléphone manquant' });
            } else {
                const cleanPhone = phoneField.replace(/\s/g, '');
                if (!/^\d{8,}$/.test(cleanPhone)) {
                    errors.push({ line: i + 1, field: 'téléphone', message: `Numéro invalide: ${phoneField}` });
                } else if (phoneNumbers.has(cleanPhone)) {
                    errors.push({ line: i + 1, field: 'téléphone', message: `Doublon détecté: ${phoneField}` });
                } else {
                    phoneNumbers.add(cleanPhone);
                }
            }

            // Find amount field
            const amountField = row['montant'] || row['amount'] || row['pension'];
            const amount = parseFloat(amountField?.replace(/\s/g, ''));

            if (!amountField || isNaN(amount)) {
                errors.push({ line: i + 1, field: 'montant', message: 'Montant invalide ou manquant' });
            } else if (amount <= 0) {
                errors.push({ line: i + 1, field: 'montant', message: `Montant négatif ou nul: ${amount}` });
            } else if (amount > 1000000) {
                warnings.push({ line: i + 1, field: 'montant', message: `Montant très élevé: ${amount.toLocaleString()} FCFA` });
                totalAmount += amount;
                validRows++;
            } else {
                totalAmount += amount;
                validRows++;
            }

            // Validate name
            const nameField = row['nom_complet'] || row['nom'] || row['name'];
            if (!nameField || nameField.length < 3) {
                warnings.push({ line: i + 1, field: 'nom', message: 'Nom incomplet ou suspect' });
            }

            // Check for potential duplicates by name
            const nameKey = nameField?.toLowerCase().trim();
            if (nameKey && duplicates.has(nameKey)) {
                warnings.push({ line: i + 1, field: 'nom', message: `Nom en doublon possible: ${nameField}` });
            } else if (nameKey) {
                duplicates.add(nameKey);
            }

            // Validate currency
            const currency = row['devise'] || row['currency'];
            if (currency && !['XOF', 'FCFA'].includes(currency.toUpperCase())) {
                warnings.push({ line: i + 1, field: 'devise', message: `Devise inhabituelle: ${currency}` });
            }
        }

        // ====== ANALYSE GEMINI AI ======
        let geminiAnalysis: GeminiAnalysis | null = null;
        let riskScore = 0;

        // Appeler Gemini seulement si pas trop d'erreurs critiques
        if (errors.length < 20) {
            console.log('Calling Gemini AI for analysis...');
            geminiAnalysis = await analyzeWithGemini(csvContent, errors, warnings);

            // Calculer un score de risque (0-100)
            if (geminiAnalysis) {
                const critiqueCount = geminiAnalysis.anomalies.filter(a => a.severite === 'critique').length;
                const moyenneCount = geminiAnalysis.anomalies.filter(a => a.severite === 'moyenne').length;
                riskScore = Math.min(100,
                    (errors.length * 10) +
                    (critiqueCount * 8) +
                    (moyenneCount * 4) +
                    (warnings.length * 2)
                );
            }
        }

        const summary = errors.length > 0
            ? `⚠️ ${errors.length} erreur(s) bloquante(s) détectée(s). Correction nécessaire.`
            : warnings.length > 0
                ? `✅ Fichier valide avec ${warnings.length} avertissement(s) à vérifier.`
                : `✅ Fichier parfaitement valide ! ${validRows} paiements prêts.`;

        return NextResponse.json({
            success: true,
            fileName,
            totalRows: lines.length - 1,
            validRows,
            errors,
            warnings,
            totalAmount,
            summary,
            geminiAnalysis,
            riskScore,
            insights: geminiAnalysis ? [
                `Score de risque: ${riskScore}/100`,
                `${geminiAnalysis.lignesRisque.length} ligne(s) à haut risque identifiée(s)`,
                `${geminiAnalysis.anomalies.length} anomalie(s) détectée(s) par l'IA`
            ] : undefined
        });

    } catch (error) {
        console.error('CSV Analysis error:', error);
        return NextResponse.json({
            error: 'Erreur lors de l\'analyse du fichier',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
