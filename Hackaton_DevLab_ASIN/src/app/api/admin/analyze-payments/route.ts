import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

interface PaymentLog {
    row: {
        _index: number;
        type_id?: string;
        valeur_id?: string;
        nom_complet?: string;
        montant?: string;
        devise?: string;
    };
    success: boolean;
    httpCode: number;
    message: string;
    transferId?: string;
    duration: number;
    timestamp: string;
}

interface AnalysisRequest {
    logs: PaymentLog[];
    stats: {
        total: number;
        processed: number;
        successCount: number;
        errorCount: number;
        remaining: number;
        elapsedTime: string;
    };
}

// Configure Gemini with OPENAI_API_KEY as per user request/project pattern
const google = createGoogleGenerativeAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.GOOGLE_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { logs, stats }: AnalysisRequest = await request.json();

        if (!logs || logs.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Aucun log à analyser'
            });
        }

        // Prepare summary for AI
        const recentLogs = logs.slice(-50); // Last 50 logs
        const errorLogs = recentLogs.filter(l => !l.success);
        const successLogs = recentLogs.filter(l => l.success);

        // Group errors by type
        const errorTypes: Record<string, number> = {};
        errorLogs.forEach(log => {
            const key = log.message || 'Unknown error';
            errorTypes[key] = (errorTypes[key] || 0) + 1;
        });

        // Calculate average duration
        const avgDuration = recentLogs.length > 0
            ? Math.round(recentLogs.reduce((sum, l) => sum + l.duration, 0) / recentLogs.length)
            : 0;

        const prompt = `Tu es un assistant d'analyse de paiements en temps réel. Ton rôle est de SURVEILLER LES ÉCHECS CRITIQUES.
Analyse ces données et fournis un bilan orienté vers les problèmes rencontrés.

STATISTIQUES GLOBALES:
- Total prévu: ${stats.total}
- Traités: ${stats.processed} (${((stats.processed / stats.total) * 100).toFixed(1)}%)
- Réussis: ${stats.successCount}
- Échoués: ${stats.errorCount}
- Restants: ${stats.remaining}
- Temps écoulé: ${stats.elapsedTime}

ERREURS RÉCENTES (${errorLogs.length} sur ${recentLogs.length} derniers):
${Object.entries(errorTypes).map(([msg, count]) => `- "${msg}": ${count}x`).join('\n') || 'Aucune erreur récente'}

EXEMPLES DE SUCCÈS RÉCENTS:
${successLogs.slice(0, 3).map(l => `- ${l.row.nom_complet || 'N/A'}: ${l.row.montant} ${l.row.devise || 'FCFA'}`).join('\n') || 'Aucun succès récent'}

INSTRUCTIONS:
1. Si des erreurs sont présentes, ton "bilan" DOIT mentionner la cause principale.
2. Dans "remarques", liste les types d'erreurs spécifiques rencontrées avec une courte explication si possible.
3. Si tout va bien, confirme simplement que les opérations se déroulent normalement.

Réponds en JSON avec ce format exact:
{
    "status": "ok" | "warning" | "critical",
    "bilan": "Phrase résumant l'état, en mettant l'accent sur les erreurs critiques si présentes",
    "remarques": ["Description de l'erreur 1", "Description de l'erreur 2"],
    "conseil": "Action recommandée pour résoudre les erreurs"
}`;

        // Use configured google provider
        const model = google(process.env.OPENAI_MODEL_NAME || 'gemini-2.5-flash');

        const { text } = await generateText({
            model,
            prompt,
        });

        // Parse AI response
        let analysis;
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found');
            }
        } catch {
            analysis = {
                status: 'ok',
                bilan: text.slice(0, 200),
                remarques: [],
                conseil: null
            };
        }

        return NextResponse.json({
            success: true,
            analysis,
            stats: {
                ...stats,
                avgDuration,
                errorRate: stats.processed > 0 ? ((stats.errorCount / stats.processed) * 100).toFixed(1) : '0'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Payment analysis error:', error);

        // Fallback: Generate basic analysis from stats without AI
        const { stats } = await request.clone().json() as AnalysisRequest;
        const errorRate = stats.processed > 0 ? (stats.errorCount / stats.processed) * 100 : 0;

        let fallbackStatus = 'ok';
        let fallbackBilan = `Traitement en cours: ${stats.processed}/${stats.total} (${((stats.processed / stats.total) * 100).toFixed(1)}%)`;
        const fallbackRemarques: string[] = [];

        if (errorRate > 10) {
            fallbackStatus = 'critical';
            fallbackBilan = `⚠️ Taux d'erreur élevé: ${errorRate.toFixed(1)}%. ${stats.errorCount} échecs sur ${stats.processed} traités.`;
            fallbackRemarques.push(`${stats.errorCount} transferts ont échoué`);
        } else if (errorRate > 0) {
            fallbackStatus = 'warning';
            fallbackRemarques.push(`${stats.errorCount} erreur(s) détectée(s)`);
        }

        if (stats.successCount > 0) {
            fallbackRemarques.push(`${stats.successCount} transferts réussis`);
        }

        // Return success: true so the chat bot can display fallback analysis
        return NextResponse.json({
            success: true,
            analysis: {
                status: fallbackStatus,
                bilan: fallbackBilan,
                remarques: fallbackRemarques,
                conseil: errorRate > 5 ? 'Vérifiez les erreurs dans les logs' : null
            },
            stats: {
                ...stats,
                avgDuration: 0,
                errorRate: errorRate.toFixed(1)
            },
            timestamp: new Date().toISOString(),
            fallback: true // Indicate this is fallback analysis
        });
    }
}
