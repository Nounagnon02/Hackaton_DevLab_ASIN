import { google } from '@ai-sdk/google';
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

        const prompt = `Tu es un assistant d'analyse de paiements en temps réel. Analyse ces données de transfert et fournis un bilan CONCIS (max 3-4 phrases).

STATISTIQUES GLOBALES:
- Total prévu: ${stats.total}
- Traités: ${stats.processed} (${((stats.processed / stats.total) * 100).toFixed(1)}%)
- Réussis: ${stats.successCount}
- Échoués: ${stats.errorCount}
- Restants: ${stats.remaining}
- Temps écoulé: ${stats.elapsedTime}
- Durée moyenne: ${avgDuration}ms

ERREURS RÉCENTES (${errorLogs.length} sur ${recentLogs.length} derniers):
${Object.entries(errorTypes).map(([msg, count]) => `- "${msg}": ${count}x`).join('\n') || 'Aucune erreur récente'}

EXEMPLES DE SUCCÈS RÉCENTS:
${successLogs.slice(0, 3).map(l => `- ${l.row.nom_complet || 'N/A'}: ${l.row.montant} ${l.row.devise || 'FCFA'}`).join('\n') || 'Aucun succès récent'}

Réponds en JSON avec ce format exact:
{
    "status": "ok" | "warning" | "critical",
    "bilan": "Phrase résumant l'état actuel des transferts",
    "remarques": ["remarque 1", "remarque 2"],
    "conseil": "Un conseil si nécessaire"
}`;

        const model = google('gemini-1.5-flash');

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
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de l\'analyse',
            analysis: {
                status: 'warning',
                bilan: 'Analyse temporairement indisponible',
                remarques: [],
                conseil: null
            }
        });
    }
}
