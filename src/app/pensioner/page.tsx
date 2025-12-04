'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import axios from 'axios';
import { ChatInterface } from '@/components/ai/ChatInterface';
import { RegistrationModal } from '@/components/auth/RegistrationModal';

export default function PensionerPage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [step, setStep] = useState<'IDLE' | 'CAMERA_ACTIVE' | 'VERIFYING' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState("Chargement...");
    const [pensionerId, setPensionerId] = useState("");
    const [pensionersList, setPensionersList] = useState<any[]>([]);

    // New state for pensioner data
    const [pensioner, setPensioner] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showRegistration, setShowRegistration] = useState(false);

    // Fetch pensioner data on component mount
    useEffect(() => {
        const fetchPensioners = async () => {
            try {
                const response = await axios.get('/api/pensioners');
                const allPensioners = response.data;
                setPensionersList(allPensioners);

                if (allPensioners.length > 0) {
                    // If no ID selected yet, select the first one
                    const targetId = pensionerId || allPensioners[0].id;
                    if (!pensionerId) setPensionerId(targetId);

                    const current = allPensioners.find((p: any) => p.id === targetId);
                    setPensioner(current);

                    // Check if registration is needed
                    if (current && !current.credentialId) {
                        setTimeout(() => setShowRegistration(true), 1000);
                    }
                }

                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch pensioners", error);
                setMessage("Erreur de chargement");
                setStep('ERROR');
                setLoading(false);
            }
        };
        fetchPensioners();
    }, [pensionerId]);

    const getStatusMessage = () => {
        if (!pensioner) return "Chargement...";

        switch (pensioner.paymentStatus) {
            case "NOT_PAID":
                return "Votre pension n'est pas encore disponible ce mois-ci.";
            case "AVAILABLE":
                return `Votre pension de ${pensioner.monthlyPension.toLocaleString()} XOF est disponible !`;
            case "WITHDRAWN":
                return "Vous avez déjà retiré votre pension ce mois-ci.";
            default:
                return "Statut inconnu";
        }
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setStep('CAMERA_ACTIVE');
            setMessage("Nɔ tɛ́n, kpɔ́n kamera ɔ mɛ... (Regardez la caméra)");
        } catch (err) {
            console.error("Error accessing camera:", err);
            setMessage("Impossible d'accéder à la caméra.");
            setStep('ERROR');
        }
    };

    const captureAndWithdraw = async () => {
        if (!videoRef.current) return;

        setStep('VERIFYING');
        setMessage("Vérification en cours...");

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        const imageBase64 = canvas.toDataURL('image/jpeg');

        try {
            const response = await axios.post('/api/pension/withdraw', {
                pensionerId,
                imageBase64
            });

            if (response.status === 202) {
                setStep('PROCESSING');
                setMessage("Traitement du transfert en cours...");

                // Stop camera immediately as verification passed
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    setStream(null);
                }

                // Poll for completion
                const pollInterval = setInterval(async () => {
                    try {
                        const res = await axios.get('/api/pensioners');
                        const updatedPensioner = res.data.find((p: any) => p.id === pensionerId);

                        if (updatedPensioner && updatedPensioner.paymentStatus === 'WITHDRAWN') {
                            clearInterval(pollInterval);
                            setPensioner(updatedPensioner);
                            setStep('SUCCESS');
                            setMessage("Akɔwé lɛ dó wɛ! (Retrait réussi)");
                        }
                    } catch (e) {
                        console.error("Polling error", e);
                    }
                }, 2000);

                // Timeout after 30s
                setTimeout(() => {
                    clearInterval(pollInterval);
                    if (step !== 'SUCCESS') {
                        setStep('ERROR');
                        setMessage("Le transfert prend plus de temps que prévu. Veuillez vérifier votre solde.");
                    }
                }, 30000);

            } else if (response.data.success) {
                // Fallback for synchronous success (if any)
                setStep('SUCCESS');
                setMessage("Akɔwé lɛ dó wɛ! (Retrait réussi)");
                setPensioner({ ...pensioner, paymentStatus: "WITHDRAWN" });
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    setStream(null);
                }
            }
        } catch (error: any) {
            console.error(error);
            setStep('ERROR');
            setMessage(error.response?.data?.error || "Erreur système.");
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden mb-20">
                <div className="bg-green-600 p-6 text-white text-center">
                    <h1 className="text-2xl font-bold">BioPension Bénin</h1>
                    <p className="opacity-90">Retrait de Pension</p>
                </div>

                <div className="p-6 flex flex-col items-center space-y-6">

                    {/* Status Card */}
                    <div className={`w-full p-4 rounded-xl border-2 ${pensioner?.paymentStatus === "AVAILABLE" ? 'bg-green-50 border-green-200' :
                        pensioner?.paymentStatus === "WITHDRAWN" ? 'bg-blue-50 border-blue-200' :
                            'bg-yellow-50 border-yellow-200'
                        }`}>
                        <div className="flex items-center gap-3">
                            <Wallet className="w-8 h-8" />
                            <div className="flex-1">
                                <p className="font-semibold text-lg">{pensioner?.name}</p>
                                <p className="text-sm opacity-75">{getStatusMessage()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Camera Viewport - Only shown when withdrawing */}
                    {(step === 'CAMERA_ACTIVE' || step === 'VERIFYING') && (
                        <div className="relative w-full aspect-square bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                            {stream ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover transform scale-x-[-1]"
                                />
                            ) : (
                                <Camera className="w-16 h-16 text-slate-600" />
                            )}

                            {step === 'VERIFYING' && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'PROCESSING' && (
                        <div className="w-full aspect-square bg-slate-100 rounded-xl flex flex-col items-center justify-center space-y-4">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
                            <p className="text-slate-600 font-medium">Transfert en cours...</p>
                        </div>
                    )}

                    {/* Status Message */}
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-semibold text-slate-800">{message}</h2>
                        <p className="text-sm text-slate-500 italic">(Guidage vocal activé)</p>
                    </div>

                    {/* Controls */}
                    <div className="w-full space-y-3">
                        {step === 'IDLE' && pensioner?.paymentStatus === 'AVAILABLE' && (
                            <button
                                onClick={startCamera}
                                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                <Wallet className="w-5 h-5" />
                                Retirer vers Mobile Money
                            </button>
                        )}

                        {step === 'CAMERA_ACTIVE' && (
                            <button
                                onClick={captureAndWithdraw}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                <Camera className="w-5 h-5" />
                                Vérifier (Kɛ́ nùkún)
                            </button>
                        )}

                        {step === 'SUCCESS' && (
                            <div className="w-full py-4 bg-green-100 text-green-800 rounded-xl font-bold text-lg flex items-center justify-center gap-2">
                                <CheckCircle className="w-6 h-6" />
                                Retrait Réussi !
                            </div>
                        )}

                        {step === 'ERROR' && (
                            <button
                                onClick={() => setStep('IDLE')}
                                className="w-full py-4 bg-red-100 text-red-800 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
                            >
                                <AlertCircle className="w-6 h-6" />
                                Réessayer
                            </button>
                        )}

                        {pensioner?.paymentStatus === 'NOT_PAID' && (
                            <div className="w-full py-4 bg-yellow-100 text-yellow-800 rounded-xl text-center">
                                <p className="font-medium">Paiement non encore disponible</p>
                                <p className="text-sm mt-1">Revenez après le paiement gouvernemental</p>
                            </div>
                        )}

                        {pensioner?.paymentStatus === 'WITHDRAWN' && (
                            <div className="w-full py-4 bg-blue-100 text-blue-800 rounded-xl text-center">
                                <p className="font-medium">Déjà retiré ce mois</p>
                                <p className="text-sm mt-1">Prochain retrait le mois prochain</p>
                            </div>
                        )}
                    </div>

                    {/* Dev Controls */}
                    <div className="w-full pt-4 border-t border-slate-100">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Simuler Identité:</label>
                        <select
                            value={pensionerId}
                            onChange={(e) => {
                                setPensionerId(e.target.value);
                                setStep('IDLE'); // Reset to idle state
                                setLoading(true); // Trigger data refetch via useEffect
                            }}
                            className="w-full p-2 border rounded-md text-sm"
                        >
                            {pensionersList.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                </div>
            </div>

            {/* AI Chat Interface - Floating Button & Modal */}
            <div className="fixed bottom-4 right-4 z-50">
                <ChatWidget />
            </div>

            {/* Registration Modal */}
            {pensioner && (
                <RegistrationModal
                    pensionerId={pensioner.id}
                    pensionerName={pensioner.name}
                    isOpen={showRegistration}
                    onClose={() => setShowRegistration(false)}
                    onSuccess={() => {
                        setShowRegistration(false);
                        // Refresh pensioner data to update credentialId
                        setPensioner({ ...pensioner, credentialId: 'registered' });
                    }}
                />
            )}
        </div>
    );
}

function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-[350px] shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <ChatInterface />
                </div>
            )}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-105 flex items-center gap-2"
            >
                {isOpen ? (
                    <span className="font-bold text-xl">×</span>
                ) : (
                    <>
                        <span className="font-bold">Aide IA</span>
                        <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse" />
                    </>
                )}
            </button>
        </>
    );
}
