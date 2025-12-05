'use client';

import { useState, useEffect } from 'react';
import { Fingerprint, Loader2, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';

interface BiometricAuthProps {
    onSuccess: (pensioner: {
        id: string;
        name: string;
        monthlyPension: number;
        paymentStatus: string;
    }) => void;
}

export function BiometricAuth({ onSuccess }: BiometricAuthProps) {
    const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [webAuthnAvailable, setWebAuthnAvailable] = useState(false);
    const [isSimulationMode, setIsSimulationMode] = useState(false);

    useEffect(() => {
        // Check if WebAuthn is available
        const available = !!(window.PublicKeyCredential && navigator.credentials);
        setWebAuthnAvailable(available);
    }, []);

    const authenticateReal = async () => {
        // REAL WebAuthn implementation using simplewebauthn

        // 1. Get options from server
        const optionsResp = await fetch('/api/auth/login/options', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const options = await optionsResp.json();

        // 2. Pass to browser for interaction
        const authenticationResponse = await startAuthentication(options);

        // 3. Send response to server for verification
        const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                response: authenticationResponse,
                challenge: options.challenge
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Authentication failed');
        }

        return data.pensioner;
    };

    const authenticateSimulation = async () => {
        // Simulation mode for demo
        await new Promise(resolve => setTimeout(resolve, 2000));

        const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                credentialId: 'demo-credential-simulation'
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Authentication failed');
        }

        return data.pensioner;
    };

    const authenticate = async () => {
        setStatus('scanning');
        setErrorMessage('');

        try {
            let pensioner;

            if (webAuthnAvailable && !isSimulationMode) {
                // Try real WebAuthn first
                try {
                    pensioner = await authenticateReal();
                } catch (error: any) {
                    // If WebAuthn fails, offer simulation as fallback
                    if (error.name === 'NotAllowedError') {
                        throw new Error('Authentification annulée');
                    } else if (error.name === 'NotSupportedError' || error.message?.includes('rpId')) {
                        setIsSimulationMode(true);
                        throw new Error('Biométrie non disponible sur HTTP. Utilisez HTTPS ou mode simulation.');
                    } else {
                        throw error;
                    }
                }
            } else {
                // Use simulation
                pensioner = await authenticateSimulation();
            }

            setStatus('success');
            setTimeout(() => {
                onSuccess(pensioner);
            }, 1000);

        } catch (error: any) {
            console.error('Biometric auth error:', error);

            // User canceled - just return to idle state silently
            if (error.name === 'NotAllowedError' || error.message?.includes('annulée')) {
                setStatus('idle');
                return;
            }

            setStatus('error');
            setErrorMessage(error.message || 'Erreur d\'authentification');
        }
    };

    const switchToSimulation = () => {
        setIsSimulationMode(true);
        setStatus('idle');
        setErrorMessage('');
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg border border-emerald-100 max-w-md mx-auto">
            {/* Status Badge */}
            <div className="mb-4 text-center">
                {webAuthnAvailable && !isSimulationMode ? (
                    <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                        <Shield className="w-3 h-3" />
                        Biométrie Activée
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Mode Simulation
                    </div>
                )}
            </div>

            <div className="text-center">
                <div className="mb-4">
                    {status === 'idle' && (
                        <Fingerprint className="w-20 h-20 mx-auto text-emerald-600" />
                    )}
                    {status === 'scanning' && (
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
                    {status === 'idle' && 'Authentification Biométrique'}
                    {status === 'scanning' && (isSimulationMode ? 'Simulation...' : 'Scan en cours...')}
                    {status === 'success' && 'Authentifié !'}
                    {status === 'error' && 'Erreur'}
                </h3>

                <p className="text-sm text-gray-600 mb-6">
                    {status === 'idle' && (
                        isSimulationMode
                            ? 'Mode simulation - Cliquez pour vous authentifier'
                            : 'Compatible avec Windows Hello, Touch ID et Face ID.'
                    )}
                    {status === 'scanning' && (
                        isSimulationMode
                            ? 'Simulation du scan biométrique...'
                            : 'Veuillez toucher le capteur biométrique'
                    )}
                    {status === 'success' && 'Connexion réussie'}
                    {status === 'error' && errorMessage}
                </p>

                {status === 'idle' && (
                    <button
                        onClick={authenticate}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        {isSimulationMode ? '🎭 S\'authentifier (Simulation)' : '🔐 S\'authentifier'}
                    </button>
                )}

                {status === 'error' && (
                    <div className="space-y-2">
                        <button
                            onClick={authenticate}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                        >
                            🔄 Réessayer
                        </button>
                        {webAuthnAvailable && !isSimulationMode && (
                            <button
                                onClick={switchToSimulation}
                                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm"
                            >
                                Passer en mode simulation
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* HTTPS Warning */}
            {!webAuthnAvailable && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    <p className="font-bold mb-1">ℹ️ Biométrie non disponible</p>
                    <p>Pour utiliser la vraie biométrie, accédez via HTTPS (ex: ngrok) ou localhost</p>
                </div>
            )}
        </div>
    );
}
