'use client';

import { useState } from 'react';
import { Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface PinAuthProps {
    onSuccess: (pensioner: {
        id: string;
        name: string;
        phoneNumber: string;
        monthlyPension: number;
        paymentStatus: string;
    }) => void;
}

export function PinAuth({ onSuccess }: PinAuthProps) {
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [pin, setPin] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phoneNumber || phoneNumber.length < 8) {
            setErrorMessage('Veuillez entrer un numéro de téléphone valide');
            return;
        }

        if (pin.length < 4) {
            setErrorMessage('Le PIN doit contenir au moins 4 chiffres');
            return;
        }

        setStatus('verifying');
        setErrorMessage('');
        console.log('Submitting phone and PIN:', phoneNumber, pin);

        try {
            const response = await fetch('/api/auth/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: phoneNumber.trim(),
                    pin: pin.trim()
                })
            });
            console.log('Response status:', response.status);

            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok || !data.success) {
                console.error('Auth failed:', data);
                throw new Error(data.error || 'Numéro ou PIN incorrect');
            }

            console.log('Auth success! Pensioner:', data.pensioner);
            setStatus('success');
            setTimeout(() => {
                onSuccess(data.pensioner);
            }, 1000);

        } catch (error: any) {
            console.error('PIN auth error:', error);
            setStatus('error');
            setErrorMessage(error.message || 'Erreur d\'authentification');
            setPin('');
        }
    };

    const handlePhoneChange = (value: string) => {
        const digits = value.trim().replace(/\D/g, '');
        setPhoneNumber(digits);
        if (status === 'error') {
            setStatus('idle');
            setErrorMessage('');
        }
    };

    const handlePinChange = (value: string) => {
        const digits = value.trim().replace(/\D/g, '');
        setPin(digits);
        if (status === 'error') {
            setStatus('idle');
            setErrorMessage('');
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg border border-emerald-100 max-w-md mx-auto">
            <div className="text-center">
                <div className="mb-4">
                    {status === 'idle' && (
                        <Lock className="w-20 h-20 mx-auto text-emerald-600" />
                    )}
                    {status === 'verifying' && (
                        <Loader2 className="w-20 h-20 mx-auto text-emerald-600 animate-spin" />
                    )}
                    {status === 'success' && (
                        <CheckCircle className="w-20 h-20 mx-auto text-green-600" />
                    )}
                    {status === 'error' && (
                        <AlertCircle className="w-20 h-20 mx-auto text-red-600" />
                    )}
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {status === 'idle' && 'Authentification par PIN'}
                    {status === 'verifying' && 'Vérification...'}
                    {status === 'success' && 'Authentifié !'}
                    {status === 'error' && 'Erreur'}
                </h3>

                <p className="text-sm text-gray-600 mb-6">
                    {status === 'idle' && 'Entrez votre numéro et code PIN'}
                    {status === 'verifying' && 'Vérification...'}
                    {status === 'success' && 'Connexion réussie'}
                    {status === 'error' && errorMessage}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                        <input
                            type="tel"
                            inputMode="numeric"
                            value={phoneNumber}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            placeholder="Ex: 97123456"
                            maxLength={14}
                            disabled={status === 'verifying' || status === 'success'}
                            className={`w-full text-lg py-3 px-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${status === 'error'
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-300'
                                }`}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Code PIN</label>
                        <input
                            type="password"
                            inputMode="numeric"
                            value={pin}
                            onChange={(e) => handlePinChange(e.target.value)}
                            placeholder="Entrez votre PIN"
                            maxLength={6}
                            disabled={status === 'verifying' || status === 'success'}
                            className={`w-full text-center text-2xl tracking-widest font-mono py-3 px-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${status === 'error'
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-300'
                                }`}
                        />
                    </div>

                    {status === 'idle' && (
                        <button
                            type="submit"
                            disabled={!phoneNumber || phoneNumber.length < 8 || pin.length < 4}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            🔐 Valider
                        </button>
                    )}

                    {status === 'error' && (
                        <button
                            type="submit"
                            disabled={!phoneNumber || phoneNumber.length < 8 || pin.length < 4}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            🔄 Réessayer
                        </button>
                    )}
                </form>

                <div className="mt-4 text-xs text-gray-500">
                    <p>💡 Utilisez le numéro et PIN de votre compte</p>
                </div>
            </div>
        </div>
    );
}
