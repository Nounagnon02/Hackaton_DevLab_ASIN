'use client';

import { useState, useRef } from 'react';
import { Upload, FileImage, Loader2, CheckCircle, AlertCircle, Play, Download } from 'lucide-react';
import { analyzePensionerImage } from '@/app/admin/image-actions';

interface ExtractedData {
    type_id: string;
    valeur_id: string;
    devise: string;
    montant: string;
    nom_complet: string;
}

export function ImageUploadWidget() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setExtractedData([]);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const result = await analyzePensionerImage(formData);

            if (result.success && result.data) {
                setExtractedData(result.data);
            } else {
                setError(result.error || 'Failed to analyze image');
            }
        } catch (e) {
            setError('An error occurred during analysis');
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleStartPayments = () => {
        if (extractedData.length === 0) return;

        // Convert to CSV string
        const headers = ['type_id', 'valeur_id', 'devise', 'montant', 'nom_complet'];
        const rows = extractedData.map(row =>
            [row.type_id, row.valeur_id, row.devise, row.montant, row.nom_complet].join(',')
        );
        const csvContent = [headers.join(','), ...rows].join('\n');

        // Store in sessionStorage to be picked up by BulkPaymentsPage
        // We use a specific key that BulkPaymentsPage checks (or we can navigate with data)
        // Since BulkPaymentsPage reads from file input usually, we might need a way to pass data.
        // A simple way is to download and let user upload, OR use sessionStorage to pass "pendingCSV"

        // Let's try passing via sessionStorage and redirecting
        sessionStorage.setItem('pendingBulkPaymentCSV', csvContent);
        window.location.href = '/admin/bulk-payments?source=session';
    };

    const handleDownloadCSV = () => {
        if (extractedData.length === 0) return;

        const headers = ['type_id', 'valeur_id', 'devise', 'montant', 'nom_complet'];
        const rows = extractedData.map(row =>
            [row.type_id, row.valeur_id, row.devise, row.montant, row.nom_complet].join(',')
        );
        const csvContent = [headers.join(','), ...rows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'extracted_payments.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-lg overflow-hidden flex flex-col shadow-xl">
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                        <FileImage className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Image Analysis</h3>
                        <p className="text-[10px] text-gray-500">Extract data from images</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Upload Area */}
                {!previewUrl ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer group"
                    >
                        <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2 group-hover:text-purple-400 transition-colors" />
                        <p className="text-xs text-gray-400 group-hover:text-gray-300">Click to upload image</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                ) : (
                    <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/50">
                        <img src={previewUrl} alt="Preview" className="w-full h-48 object-contain" />
                        <button
                            onClick={() => { setFile(null); setPreviewUrl(null); setExtractedData([]); }}
                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/80 text-white transition-colors"
                        >
                            <AlertCircle className="w-4 h-4 rotate-45" />
                        </button>
                    </div>
                )}

                {/* Analyze Button */}
                {file && !extractedData.length && (
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <FileImage className="w-3 h-3" />
                                Extract Data
                            </>
                        )}
                    </button>
                )}

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Results */}
                {extractedData.length > 0 && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-emerald-400 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {extractedData.length} records found
                            </span>
                        </div>

                        <div className="max-h-40 overflow-y-auto custom-scrollbar border border-white/10 rounded bg-white/5 p-2">
                            <table className="w-full text-[10px] text-left">
                                <thead className="text-gray-500 border-b border-white/5">
                                    <tr>
                                        <th className="pb-1">Name</th>
                                        <th className="pb-1 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-300">
                                    {extractedData.map((row, i) => (
                                        <tr key={i} className="border-b border-white/5 last:border-0">
                                            <td className="py-1 truncate max-w-[120px]">{row.nom_complet}</td>
                                            <td className="py-1 text-right font-mono text-cyan-400">{row.montant} {row.devise}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleDownloadCSV}
                                className="py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-2 border border-white/10"
                            >
                                <Download className="w-3 h-3" />
                                CSV
                            </button>
                            <button
                                onClick={handleStartPayments}
                                className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            >
                                <Play className="w-3 h-3" />
                                Pay Now
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
