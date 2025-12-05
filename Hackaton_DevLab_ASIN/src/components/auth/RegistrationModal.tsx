'use client';

import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { Fingerprint, X, ShieldCheck, Loader2 } from 'lucide-react';
import axios from 'axios';

interface RegistrationModalProps {
    pensionerId: string;
    pensionerName: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function RegistrationModal({ pensionerId, pensionerName, isOpen, onClose, onSuccess }: RegistrationModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleRegister = async () => {
        setLoading(true);
        setError('');

        try {
            // 1. Get options from server
            const optionsResp = await axios.post('/api/auth/register/options', { pensionerId });
            const options = optionsResp.data;

            // 2. Pass to browser for interaction (TouchID, FaceID, Windows Hello)
            const registrationResponse = await startRegistration(options);

            // 3. Send response to server for verification
            const verifyResp = await axios.post('/api/auth/register/verify', {
                pensionerId,
                response: registrationResponse,
                challenge: options.challenge // Passing challenge back as discussed
            });

            if (verifyResp.data.verified) {
                onSuccess();
            } else {
                setError('La vérification a échoué.');
            }

        } catch (err: any) {
            console.error(err);
            if (err.name === 'NotAllowedError') {
                setError('Enregistrement annulé.');
            } else {
                setError(err.response?.data?.error || err.message || 'Une erreur est survenue.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-emerald-600 p-6 text-white flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold">Sécurisez votre compte</h2>
                        <p className="text-emerald-100 text-sm mt-1">Bonjour, {pensionerName}</p>
                    </div>
                    <button onClick={onClose} className="text-emerald-100 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 text-center space-y-6">
                    <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Fingerprint className="w-10 h-10 text-emerald-600" />
                    </div>

                    <div className="space-y-2">
                        <p className="text-gray-700 font-medium">
                            Enregistrez votre empreinte digitale ou votre visage pour vous connecter plus rapidement et en toute sécurité.
                        </p>
                        <p className="text-sm text-gray-500">
                            Compatible avec <span className="font-semibold text-emerald-700">Windows Hello</span>, Touch ID et Face ID.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleRegister}
                        disabled={loading}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-5 h-5" />
                                Enregistrer mon empreinte
                            </>
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        className="text-gray-400 text-sm hover:text-gray-600 underline"
                    >
                        Plus tard
                    </button>
                </div>
            </div>
        </div>
    );
}
