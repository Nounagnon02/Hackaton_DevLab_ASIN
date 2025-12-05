'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

type AnalysisResult = {
    fileName: string;
    totalRows: number;
    validRows: number;
    errors: Array<{ line: number; field: string; message: string }>;
    warnings: Array<{ line: number; field: string; message: string }>;
    totalAmount: number;
    summary: string;
    geminiAnalysis?: GeminiAnalysis;
    riskScore?: number;
    insights?: string[];
};

export function CSVUploadWidget({ onAnalysisComplete }: { onAnalysisComplete?: (result: any) => void }) {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [csvFileContent, setCsvFileContent] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const content = event.target?.result as string;
                setCsvFileContent(content);

                const response = await fetch('/api/admin/analyze-csv', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        csvContent: content,
                        fileName: file.name
                    })
                });

                const result = await response.json();

                if (result.success) {
                    setAnalysisResult(result);
                    if (onAnalysisComplete) {
                        onAnalysisComplete(result);
                    }
                } else if (result.error) {
                    setError(result.error);
                }

                setUploading(false);
            };

            reader.onerror = () => {
                setError('Erreur lors de la lecture du fichier');
                setUploading(false);
            };

            reader.readAsText(file);
        } catch (err) {
            setError('Erreur lors de l\'upload');
            setUploading(false);
        }
    };

    return (
        <div className="bg-[#0a0a0a]/80 backdrop-blur-md rounded-lg border border-white/10 p-6 max-w-md relative overflow-hidden">
            {/* Background Grid Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

            <div className="relative z-10 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                    {uploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent"></div>
                    ) : (
                        <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    )}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white mb-2">Charger le fichier CSV</h3>
                    <p className="text-sm text-gray-400 mb-4">
                        {uploading ? 'Analyse IA en cours...' : 'Glissez votre fichier ici ou cliquez pour sélectionner'}
                    </p>
                </div>
                <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 file:border file:border-cyan-500/30 hover:file:bg-cyan-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-sm text-rose-400">
                        ❌ {error}
                    </div>
                )}
                <p className="text-xs text-gray-500">Formats acceptés : CSV, Excel (.xlsx, .xls)</p>
            </div>

            {analysisResult && (
                <div className="relative z-10 mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${analysisResult.errors.length > 0 ? 'bg-rose-500/10 border border-rose-500/30' : analysisResult.warnings.length > 0 ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-emerald-500/10 border border-emerald-500/30'}`}>
                            {analysisResult.errors.length > 0 ? '❌' : analysisResult.warnings.length > 0 ? '⚠️' : '✅'}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-white">{analysisResult.fileName}</h4>
                            <p className="text-sm text-gray-400">{analysisResult.summary}</p>
                        </div>
                        {analysisResult.riskScore !== undefined && (
                            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${analysisResult.riskScore > 50 ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : analysisResult.riskScore > 20 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                                Risque: {analysisResult.riskScore}/100
                            </div>
                        )}
                    </div>

                    {/* Gemini AI Analysis */}
                    {analysisResult.geminiAnalysis && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">🤖</span>
                                <h5 className="text-xs font-bold text-purple-300 uppercase tracking-widest">Analyse IA Gemini</h5>
                            </div>
                            <p className="text-sm text-purple-200 mb-2">{analysisResult.geminiAnalysis.bilan}</p>

                            {analysisResult.geminiAnalysis.recommandations.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    <p className="text-xs font-bold text-purple-300">Recommandations:</p>
                                    {analysisResult.geminiAnalysis.recommandations.map((rec, i) => (
                                        <div key={i} className="text-xs text-purple-200 flex items-start gap-1">
                                            <span>•</span>
                                            <span>{rec}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
                            <p className="text-xs text-gray-500 mb-1">Total</p>
                            <p className="text-xl font-bold text-white">{analysisResult.totalRows}</p>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center backdrop-blur-sm">
                            <p className="text-xs text-gray-500 mb-1">Valides</p>
                            <p className="text-xl font-bold text-emerald-400">{analysisResult.validRows}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
                            <p className="text-xs text-gray-500 mb-1">Montant</p>
                            <p className="text-sm font-bold text-white">{analysisResult.totalAmount.toLocaleString()} FCFA</p>
                        </div>
                    </div>

                    {analysisResult.errors.length > 0 && (
                        <div className="mb-3">
                            <h5 className="text-xs font-bold text-rose-400 mb-2">🚫 {analysisResult.errors.length} Erreur(s)</h5>
                            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-2 space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                {analysisResult.errors.slice(0, 3).map((err, i) => (
                                    <div key={i} className="text-xs text-rose-300">
                                        <span className="font-mono bg-rose-500/20 px-1 rounded">L{err.line}</span> {err.field}: {err.message}
                                    </div>
                                ))}
                                {analysisResult.errors.length > 3 && (
                                    <p className="text-xs text-rose-400 italic">... +{analysisResult.errors.length - 3} autre(s)</p>
                                )}
                            </div>
                        </div>
                    )}

                    {analysisResult.warnings.length > 0 && analysisResult.errors.length === 0 && (
                        <div className="mb-3">
                            <h5 className="text-xs font-bold text-amber-400 mb-2">⚠️ {analysisResult.warnings.length} Avertissement(s)</h5>
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                                {analysisResult.warnings.slice(0, 2).map((warn, i) => (
                                    <div key={i} className="text-xs text-amber-300">
                                        <span className="font-mono bg-amber-500/20 px-1 rounded">L{warn.line}</span> {warn.message}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        disabled={analysisResult.errors.length > 0}
                        onClick={() => {
                            if (analysisResult.errors.length === 0) {
                                sessionStorage.setItem('csvAnalysisResult', JSON.stringify(analysisResult));
                                if (csvFileContent) {
                                    sessionStorage.setItem('csvFileContent', csvFileContent);
                                    sessionStorage.setItem('autoStartTransfer', 'true');
                                }
                                // Keep chat open after navigation
                                sessionStorage.setItem('chatPopupOpen', 'true');
                                // Force full page reload to trigger useEffect
                                window.location.href = '/admin/bulk-payments';
                            }
                        }}
                        className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${analysisResult.errors.length > 0
                            ? 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]'
                            }`}
                    >
                        {analysisResult.errors.length > 0 ? '❌ Correction nécessaire' : '✅ Valider et continuer'}
                    </button>
                </div>
            )}
        </div>
    );
}
