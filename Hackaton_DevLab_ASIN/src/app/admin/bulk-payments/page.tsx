'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, Play, Pause, Download, Activity, Trash2, AlertCircle, CheckCircle, XCircle, RefreshCw, Zap, Layers, FileText } from 'lucide-react';
import { AdminChatPopup } from '@/components/admin/AdminChatPopup';

interface PaymentResult {
    row: any;
    success: boolean;
    httpCode: number;
    httpStatus: string;
    currentState: string;
    transferId: string;
    message: string;
    lastError: string;
    duration: number;
    txId: string;
    timestamp: string;
}

interface SavedSession {
    fileId: string;
    fileName: string;
    logs: PaymentResult[];
    processedIndices: number[];
    successCount: number;
    errorCount: number;
    timestamp: string;
}

// --- IndexedDB Helper ---
const DB_NAME = 'PaymentNexusDB';
const STORE_NAME = 'sessions';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
};

const dbSave = async (key: string, value: any) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
};

const dbGet = async (key: string): Promise<any> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
};

const dbDelete = async (key: string) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
};
// ------------------------

export default function BulkPaymentsPage() {
    const [csvData, setCsvData] = useState<any[]>([]);
    const [logs, setLogs] = useState<PaymentResult[]>([]);
    const [successCount, setSuccessCount] = useState(0);
    const [errorCount, setErrorCount] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [currentFileId, setCurrentFileId] = useState<string | null>(null);
    const [currentFileName, setCurrentFileName] = useState<string | null>(null);
    const [hasSavedSession, setHasSavedSession] = useState(false);
    const [processedIndices, setProcessedIndices] = useState<Set<number>>(new Set());
    const [activeTab, setActiveTab] = useState<'all' | 'success' | 'errors'>('all');
    const [isWorkerReady, setIsWorkerReady] = useState(false);

    // Refs for auto-save and avoiding stale closures
    const logsRef = useRef<PaymentResult[]>([]);
    const processedIndicesRef = useRef<Set<number>>(new Set());
    const successCountRef = useRef(0);
    const errorCountRef = useRef(0);
    const csvDataRef = useRef<any[]>([]);
    const elapsedTimeRef = useRef('00:00:00');

    const workerRef = useRef<Worker | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [config, setConfig] = useState({
        apiUrl: 'http://localhost:3001/transfers',
        workers: 10,
        delay: 50,
        restartInterval: 200,
        payerIdType: 'MSISDN',
        payerId: '123456789'
    });

    // Sync state to refs
    useEffect(() => { logsRef.current = logs; }, [logs]);
    useEffect(() => { processedIndicesRef.current = processedIndices; }, [processedIndices]);
    useEffect(() => { successCountRef.current = successCount; }, [successCount]);
    useEffect(() => { errorCountRef.current = errorCount; }, [errorCount]);
    useEffect(() => { csvDataRef.current = csvData; }, [csvData]);
    useEffect(() => { elapsedTimeRef.current = elapsedTime; }, [elapsedTime]);

    // Check for pending CSV from Image Upload
    useEffect(() => {
        const pendingCSV = sessionStorage.getItem('pendingBulkPaymentCSV');
        if (pendingCSV) {
            console.log('Found pending CSV from image upload');
            const data = parseCSV(pendingCSV);
            setCsvData(data);
            setCurrentFileId(`image_upload_${Date.now()}`);
            setCurrentFileName('extracted_from_image.csv');
            sessionStorage.removeItem('pendingBulkPaymentCSV');
        }
    }, []);

    // Throttled Auto-save every 5 seconds when running
    useEffect(() => {
        if (isRunning && currentFileId) {
            if (!saveIntervalRef.current) {
                saveIntervalRef.current = setInterval(async () => {
                    if (processedIndicesRef.current.size > 0) {
                        const session: SavedSession = {
                            fileId: currentFileId,
                            fileName: currentFileName || 'unknown.csv',
                            logs: logsRef.current,
                            processedIndices: Array.from(processedIndicesRef.current),
                            successCount: successCountRef.current,
                            errorCount: errorCountRef.current,
                            timestamp: new Date().toISOString()
                        };
                        try {
                            await dbSave(`session_${currentFileId}`, session);
                            console.log('Session saved:', session.processedIndices.length, 'items');
                        } catch (e) {
                            console.error("Auto-save failed", e);
                        }
                    }
                }, 5000);
            }
        } else {
            if (saveIntervalRef.current) {
                clearInterval(saveIntervalRef.current);
                saveIntervalRef.current = null;
                // Final save when stopping
                if (currentFileId && processedIndicesRef.current.size > 0) {
                    const session: SavedSession = {
                        fileId: currentFileId,
                        fileName: currentFileName || 'unknown.csv',
                        logs: logsRef.current,
                        processedIndices: Array.from(processedIndicesRef.current),
                        successCount: successCountRef.current,
                        errorCount: errorCountRef.current,
                        timestamp: new Date().toISOString()
                    };
                    dbSave(`session_${currentFileId}`, session)
                        .then(() => console.log('Final save complete'))
                        .catch(e => console.error("Final save failed", e));
                }
            }
        }
        return () => {
            if (saveIntervalRef.current) {
                clearInterval(saveIntervalRef.current);
                saveIntervalRef.current = null;
            }
        };
    }, [isRunning, currentFileId, currentFileName]);

    // Initialize Worker
    useEffect(() => {
        workerRef.current = new Worker('/payment-worker.js');
        setIsWorkerReady(true);
        workerRef.current.onmessage = (e) => {
            const { type, payload } = e.data;
            if (type === 'PROGRESS') {
                // Handle each log and update stats locally
                const newLogs: PaymentResult[] = payload.logs;

                setLogs(prev => [...prev, ...newLogs]);

                newLogs.forEach((log: PaymentResult) => {
                    // Use original _index from the row
                    setProcessedIndices(prev => new Set([...prev, log.row._index]));

                    if (log.success) {
                        setSuccessCount(prev => prev + 1);
                    } else {
                        setErrorCount(prev => prev + 1);
                    }
                });

            } else if (type === 'COMPLETE') {
                setIsRunning(false);
                if (timerRef.current) clearInterval(timerRef.current);
            } else if (type === 'RESTART_NEEDED') {
                fetch('http://localhost:3001/restart-all', { method: 'POST' }).catch(() => { });
            }
        };
        return () => workerRef.current?.terminate();
    }, []);

    // Auto-scroll
    useEffect(() => {
        if (isRunning && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [logs.length, isRunning]);

    // AI Analysis every 10 seconds
    const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastAnalysisCountRef = useRef(0);

    const triggerAnalysis = async () => {
        console.log('🤖 triggerAnalysis called, logs count:', logsRef.current.length);
        if (logsRef.current.length === 0) {
            console.log('🤖 No logs yet, skipping analysis');
            return;
        }

        console.log('🤖 Triggering AI analysis...', logsRef.current.length, 'logs');

        try {
            // Get current stats from refs to avoid stale closures
            const currentStats = {
                total: csvDataRef.current.length,
                processed: processedIndicesRef.current.size,
                successCount: successCountRef.current,
                errorCount: errorCountRef.current,
                remaining: csvDataRef.current.length - processedIndicesRef.current.size,
                elapsedTime: elapsedTimeRef.current
            };

            console.log('🤖 Sending stats:', currentStats);

            const response = await fetch('/api/admin/analyze-payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    logs: logsRef.current,
                    stats: currentStats
                })
            });

            const result = await response.json();
            console.log('🤖 Analysis result:', result);

            if (result.success) {
                // Store analysis for chat bot to pick up
                const analysisData = {
                    ...result,
                    id: Date.now()
                };
                console.log('🤖 Storing analysis data in sessionStorage:', analysisData);
                sessionStorage.setItem('paymentAnalysis', JSON.stringify(analysisData));
                // Ensure chat is open
                sessionStorage.setItem('chatPopupOpen', 'true');
                // Dispatch event to notify chat
                console.log('🤖 Dispatching paymentAnalysisUpdate event');
                window.dispatchEvent(new CustomEvent('paymentAnalysisUpdate'));
            } else {
                console.log('🤖 Analysis failed:', result.error);
            }
        } catch (e) {
            console.error('🤖 Analysis fetch failed:', e);
        }
    };

    useEffect(() => {
        if (isRunning && csvData.length > 0) {
            console.log('🚀 Starting AI analysis interval');

            // First analysis after 3 seconds (reduced for faster feedback)
            const firstAnalysisTimeout = setTimeout(() => {
                console.log('🤖 First analysis timeout triggered, logs:', logsRef.current.length);
                if (logsRef.current.length > 0) {
                    lastAnalysisCountRef.current = logsRef.current.length;
                    triggerAnalysis();
                }
            }, 3000);

            // Then every 8 seconds (more frequent for debugging)
            analysisIntervalRef.current = setInterval(() => {
                console.log('🤖 Interval check - logs:', logsRef.current.length, 'last:', lastAnalysisCountRef.current);
                // Trigger if we have logs (even if same count, for debugging)
                if (logsRef.current.length > 0) {
                    if (logsRef.current.length > lastAnalysisCountRef.current) {
                        lastAnalysisCountRef.current = logsRef.current.length;
                    }
                    triggerAnalysis();
                }
            }, 8000);

            return () => {
                clearTimeout(firstAnalysisTimeout);
                if (analysisIntervalRef.current) {
                    clearInterval(analysisIntervalRef.current);
                }
            };
        } else {
            // Clear interval when not running
            if (analysisIntervalRef.current) {
                clearInterval(analysisIntervalRef.current);
                analysisIntervalRef.current = null;
            }
        }

        return () => {
            if (analysisIntervalRef.current) {
                clearInterval(analysisIntervalRef.current);
            }
        };
    }, [isRunning, csvData.length]);

    const parseCSV = (content: string) => {
        const lines = content.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data: any[] = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length === headers.length && values[0]) {
                const row: any = { _index: i - 1 };
                headers.forEach((h, j) => row[h] = values[j]);
                data.push(row);
            }
        }
        return data;
    };

    // Auto-start from Chat Bot
    useEffect(() => {
        if (!isWorkerReady || !workerRef.current) return;

        const autoStart = sessionStorage.getItem('autoStartTransfer');
        const csvContent = sessionStorage.getItem('csvFileContent');
        const analysisResultStr = sessionStorage.getItem('csvAnalysisResult');

        if (autoStart === 'true' && csvContent) {
            console.log('🚀 Auto-starting transfer from chat bot...');

            try {
                // Parse and set data
                const data = parseCSV(csvContent);
                setCsvData(data);

                // Set file metadata if available
                if (analysisResultStr) {
                    const analysis = JSON.parse(analysisResultStr);
                    if (analysis.fileName) {
                        setCurrentFileName(analysis.fileName);
                        // Generate a file ID (using timestamp as fallback for size)
                        const fileId = `${analysis.fileName}_${Date.now()}`;
                        setCurrentFileId(fileId);
                    }
                } else {
                    setCurrentFileName('import_chat.csv');
                    setCurrentFileId(`import_chat_${Date.now()}`);
                }

                // Reset state
                setLogs([]);
                setProcessedIndices(new Set());
                setSuccessCount(0);
                setErrorCount(0);

                // Clear session storage
                sessionStorage.removeItem('autoStartTransfer');
                sessionStorage.removeItem('csvFileContent');

                // Start payments immediately
                setIsRunning(true);
                startTimeRef.current = Date.now();

                if (timerRef.current) clearInterval(timerRef.current);
                timerRef.current = setInterval(() => {
                    const elapsed = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
                    const h = Math.floor(elapsed / 3600);
                    const m = Math.floor((elapsed % 3600) / 60);
                    const s = elapsed % 60;
                    setElapsedTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
                }, 1000);

                workerRef.current.postMessage({ type: 'START', payload: { data, config } });

            } catch (e) {
                console.error("Auto-start failed:", e);
                alert("Erreur lors du démarrage automatique.");
            }
        }
    }, [isWorkerReady]);

    // Filtered logs
    const filteredLogs = useMemo(() => {
        if (activeTab === 'success') return logs.filter(l => l.success);
        if (activeTab === 'errors') return logs.filter(l => !l.success);
        return logs;
    }, [logs, activeTab]);

    const errorLogs = useMemo(() => logs.filter(l => !l.success), [logs]);
    const successLogs = useMemo(() => logs.filter(l => l.success), [logs]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileId = `${file.name}_${file.size}`;
        setCurrentFileId(fileId);
        setCurrentFileName(file.name);

        // Check DB for session
        let savedSession: SavedSession | null = null;
        try {
            savedSession = await dbGet(`session_${fileId}`);
            if (savedSession && savedSession.processedIndices && savedSession.processedIndices.length > 0) {
                setHasSavedSession(true);
                console.log('Found saved session:', savedSession.processedIndices.length, 'processed');
            } else {
                setHasSavedSession(false);
            }
        } catch (e) {
            console.error("DB Error", e);
            setHasSavedSession(false);
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const data = parseCSV(content);
            setCsvData(data);

            // Always reset state when loading a new file
            // User must click "Resume" to restore progress
            setLogs([]);
            setProcessedIndices(new Set());
            setSuccessCount(0);
            setErrorCount(0);
        };
        reader.readAsText(file);
    };

    const restoreSession = async () => {
        if (!currentFileId) return;
        try {
            const session: SavedSession = await dbGet(`session_${currentFileId}`);
            if (session) {
                console.log("Restoring session:", session);

                // Restore logs
                setLogs(session.logs || []);

                // Restore counts
                setSuccessCount(session.successCount || 0);
                setErrorCount(session.errorCount || 0);

                // Restore processed indices
                const indices = new Set(session.processedIndices.map(Number));
                setProcessedIndices(indices);

                setHasSavedSession(false);

                console.log(`Restored: ${indices.size} processed, ${session.successCount} success, ${session.errorCount} errors`);
            }
        } catch (e) {
            console.error("Failed to restore session", e);
            alert("Erreur lors de la restauration.");
        }
    };

    const clearSession = async () => {
        if (!currentFileId) return;
        try {
            await dbDelete(`session_${currentFileId}`);
            setHasSavedSession(false);
            setLogs([]);
            setProcessedIndices(new Set());
            setSuccessCount(0);
            setErrorCount(0);
        } catch { }
    };

    const startPayments = () => {
        if (!workerRef.current || csvData.length === 0) return;

        // Filter out already processed items
        const remainingData = csvData.filter(row => !processedIndices.has(row._index));

        console.log(`Starting: ${csvData.length} total, ${processedIndices.size} already processed, ${remainingData.length} remaining`);

        if (remainingData.length === 0) {
            alert('Tous les paiements ont déjà été traités !');
            return;
        }

        setIsRunning(true);
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
            const h = Math.floor(elapsed / 3600);
            const m = Math.floor((elapsed % 3600) / 60);
            const s = elapsed % 60;
            setElapsedTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }, 1000);

        // Send ONLY remaining data to worker
        workerRef.current.postMessage({ type: 'START', payload: { data: remainingData, config } });
    };

    const retryFailed = () => {
        if (!workerRef.current || errorLogs.length === 0) return;
        const failedData = errorLogs.map(log => log.row);

        // Remove failed indices from processed
        const newProcessed = new Set(processedIndices);
        failedData.forEach(row => newProcessed.delete(row._index));
        setProcessedIndices(newProcessed);

        // Remove error logs and update counts
        setLogs(prev => prev.filter(l => l.success));
        setErrorCount(0);

        setIsRunning(true);
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
            const h = Math.floor(elapsed / 3600);
            const m = Math.floor((elapsed % 3600) / 60);
            const s = elapsed % 60;
            setElapsedTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }, 1000);
        workerRef.current.postMessage({ type: 'START', payload: { data: failedData, config } });
    };

    const stopPayments = () => {
        workerRef.current?.postMessage({ type: 'STOP' });
        setIsRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const resetAll = async () => {
        if (confirm('Réinitialiser tout ?')) {
            setCsvData([]);
            setLogs([]);
            setSuccessCount(0);
            setErrorCount(0);
            setProcessedIndices(new Set());
            setElapsedTime('00:00:00');
            if (currentFileId) await dbDelete(`session_${currentFileId}`);
            setCurrentFileId(null);
            setCurrentFileName(null);
            setHasSavedSession(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const exportCSV = (type: 'all' | 'errors' | 'success') => {
        const data = type === 'errors' ? errorLogs : type === 'success' ? successLogs : logs;
        if (data.length === 0) return;
        const headers = ['index', 'type_id', 'valeur_id', 'nom_complet', 'montant', 'devise', 'status', 'http_code', 'message', 'transfer_id', 'timestamp'];
        const rows = data.map(r => [r.row._index + 1, r.row.type_id, r.row.valeur_id, r.row.nom_complet, r.row.montant, r.row.devise, r.success ? 'SUCCESS' : 'FAILED', r.httpCode, (r.message || '').replace(/"/g, "'"), r.transferId, r.timestamp]);
        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `paiements_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Computed stats
    const total = csvData.length;
    const processed = processedIndices.size;
    const remaining = total - processed;
    const progress = total > 0 ? ((processed / total) * 100).toFixed(1) : '0';
    const speed = processed > 0 && startTimeRef.current ? (processed / ((Date.now() - startTimeRef.current) / 1000)).toFixed(1) : '0';

    return (
        <div className="h-screen bg-[#050505] text-gray-300 font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col">
            {/* Background Grid Effect */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                            <Zap className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-white tracking-tight uppercase ">Gbè<span className="text-cyan-400 uppercase">dagbé</span></h1>
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                System Online
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="text-right">
                            <p className="text-2xl font-mono font-medium text-white tracking-wider tabular-nums">{elapsedTime}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Session Time</p>
                        </div>
                        <div className={`px-4 py-1.5 rounded border ${isRunning ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                            <span className="text-xs font-bold tracking-wider uppercase">{isRunning ? 'Active' : 'Standby'}</span>
                        </div>
                    </div>
                </div>

                {/* Crypto Ticker Stats */}
                <div className="px-6 py-4 border-t border-white/5 grid grid-cols-7 gap-px bg-white/5">
                    {[
                        { label: 'Total Rows', value: total, icon: Layers, color: 'text-white' },
                        { label: 'Processed', value: processed, icon: Activity, color: 'text-cyan-400' },
                        { label: 'Success', value: successCount, icon: CheckCircle, color: 'text-emerald-400' },
                        { label: 'Failed', value: errorCount, icon: XCircle, color: 'text-rose-400' },
                        { label: 'Remaining', value: remaining, icon: AlertCircle, color: 'text-amber-400' },
                        { label: 'Speed (tx/s)', value: speed, icon: Zap, color: 'text-violet-400' },
                        { label: 'Progress', value: `${progress}%`, icon: RefreshCw, color: 'text-blue-400' },
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center justify-center p-2 hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-2 mb-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                <stat.icon className={`w-3 h-3 ${stat.color}`} />
                                <span className="text-[10px] uppercase tracking-wider">{stat.label}</span>
                            </div>
                            <span className={`text-xl font-mono font-bold ${stat.color}`}>{stat.value}</span>
                        </div>
                    ))}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden flex relative z-10">
                {/* Left Panel: Controls & Config */}
                <div className="w-80 border-r border-white/5 bg-[#0a0a0a]/50 backdrop-blur-sm flex flex-col">
                    <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                        {/* File Upload */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-3 h-3" /> Data Source
                            </h3>
                            <div className="relative group">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className={`border border-dashed rounded-lg p-6 text-center transition-all ${currentFileName ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5'}`}>
                                    <Upload className={`w-6 h-6 mx-auto mb-2 ${currentFileName ? 'text-emerald-400' : 'text-gray-400'}`} />
                                    <p className="text-xs text-gray-400 truncate px-2">
                                        {currentFileName || 'Drop CSV file or click to upload'}
                                    </p>
                                </div>
                            </div>

                            {hasSavedSession && (
                                <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                                    <span className="text-xs text-amber-400">Session found</span>
                                    <div className="flex gap-2">
                                        <button onClick={restoreSession} className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-2 py-1 rounded transition-colors">Resume</button>
                                        <button onClick={clearSession} className="text-[10px] bg-white/5 hover:bg-white/10 text-gray-400 px-2 py-1 rounded transition-colors">Discard</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Configuration */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Configuration
                            </h3>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Concurrency</label>
                                    <div className="flex items-center gap-3 bg-white/5 p-2 rounded border border-white/5">
                                        <input
                                            type="range"
                                            min="1"
                                            max="50"
                                            value={config.workers}
                                            onChange={(e) => setConfig({ ...config, workers: parseInt(e.target.value) })}
                                            className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                        />
                                        <span className="text-xs font-mono text-cyan-400 w-6 text-right">{config.workers}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Delay (ms)</label>
                                    <div className="flex items-center gap-3 bg-white/5 p-2 rounded border border-white/5">
                                        <input
                                            type="range"
                                            min="0"
                                            max="1000"
                                            step="10"
                                            value={config.delay}
                                            onChange={(e) => setConfig({ ...config, delay: parseInt(e.target.value) })}
                                            className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                        />
                                        <span className="text-xs font-mono text-cyan-400 w-8 text-right">{config.delay}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2 pt-4 border-t border-white/5">
                            <button
                                onClick={isRunning ? stopPayments : startPayments}
                                disabled={csvData.length === 0}
                                className={`w-full py-3 rounded-lg font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${isRunning
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500/30'
                                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {isRunning ? 'STOP PROCESS' : 'START PROCESS'}
                            </button>

                            {errorCount > 0 && !isRunning && (
                                <button
                                    onClick={retryFailed}
                                    className="w-full py-2 rounded-lg font-medium text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-3 h-3" /> RETRY FAILED ({errorCount})
                                </button>
                            )}

                            <button
                                onClick={resetAll}
                                className="w-full py-2 rounded-lg font-medium text-xs bg-white/5 text-gray-400 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-3 h-3" /> RESET ALL
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Logs & Visualization */}
                <div className="flex-1 flex flex-col bg-[#050505] relative">
                    {/* Tabs */}
                    <div className="flex items-center border-b border-white/5 bg-[#0a0a0a]/50">
                        {(['all', 'success', 'errors'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative ${activeTab === tab ? 'text-cyan-400 bg-white/5' : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>}
                            </button>
                        ))}
                        <div className="ml-auto px-4 flex gap-2">
                            <button onClick={() => exportCSV('all')} className="p-1.5 text-gray-500 hover:text-white transition-colors" title="Export All"><Download className="w-4 h-4" /></button>
                        </div>
                    </div>

                    {/* Logs Console */}
                    <div
                        ref={scrollContainerRef}
                        className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 custom-scrollbar"
                    >
                        {filteredLogs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                    <Activity className="w-8 h-8 opacity-20" />
                                </div>
                                <p>System Ready. Waiting for input...</p>
                            </div>
                        ) : (
                            filteredLogs.map((log, i) => (
                                <div key={i} className={`flex items-start gap-3 p-2 rounded border-l-2 ${log.success
                                    ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-200'
                                    : 'border-rose-500/50 bg-rose-500/5 text-rose-200'
                                    } animate-in fade-in slide-in-from-left-2 duration-200`}>
                                    <span className="text-white/30 w-12 shrink-0">{new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}</span>
                                    <span className={`font-bold w-16 shrink-0 ${log.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {log.success ? 'SUCCESS' : 'FAILED'}
                                    </span>
                                    <span className="text-white/50 w-16 shrink-0">#{log.row._index + 1}</span>
                                    <div className="w-48 shrink-0 flex flex-col">
                                        <span className="text-white font-medium truncate">{log.row.nom_complet || 'Unknown'}</span>
                                        <span className="text-xs text-white/50">{log.row.montant} {log.row.devise}</span>
                                    </div>
                                    <span className="flex-1 truncate text-white/70">{log.message}</span>
                                    {log.transferId && <span className="text-white/30 text-[10px] hidden xl:block">{log.transferId}</span>}
                                    <span className="text-white/30">{log.duration}ms</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            <AdminChatPopup />
        </div>
    );
}
