'use client';

import { useState, useEffect } from 'react';
import { Users, CreditCard, CheckCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

export default function AdminPage() {
    const [loading, setLoading] = useState(false);
    const [paymentResult, setPaymentResult] = useState<any>(null);
    const [pensioners, setPensioners] = useState<any[]>([]);

    const fetchPensioners = async () => {
        try {
            const res = await axios.get('/api/pensioners');
            setPensioners(res.data);
        } catch (e) {
            console.error("Failed to fetch pensioners");
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchPensioners();
    }, []);

    const handleBulkPayment = async () => {
        setLoading(true);
        setPaymentResult(null);
        try {
            const response = await axios.post('/api/pension/batch');

            if (response.status === 202) {
                setPaymentResult({
                    success: true,
                    message: "Paiement initié ! Traitement en cours...",
                    details: response.data.details
                });

                // Start polling for updates
                const pollInterval = setInterval(async () => {
                    const res = await axios.get('/api/pensioners');
                    setPensioners(res.data);

                    // Check if any are AVAILABLE (meaning payment completed)
                    const anyAvailable = res.data.some((p: any) => p.paymentStatus === 'AVAILABLE');
                    if (anyAvailable) {
                        clearInterval(pollInterval);
                        setPaymentResult({
                            success: true,
                            message: "Paiement terminé avec succès !",
                            details: { status: "COMPLETED" }
                        });
                        setLoading(false);
                    }
                }, 2000);

                // Stop polling after 30 seconds to avoid infinite loops
                setTimeout(() => {
                    clearInterval(pollInterval);
                    setLoading(false);
                }, 30000);

            } else {
                setPaymentResult(response.data);
                setLoading(false);
                // Refresh list immediately if synchronous
                const res = await axios.get('/api/pensioners');
                setPensioners(res.data);
            }
        } catch (error: any) {
            console.error("Payment failed", error);
            setPaymentResult({
                success: false,
                message: error.response?.data?.error || "Erreur lors du paiement",
                details: error.response?.data?.details
            });
            setLoading(false);
        }
    };

    const availableCount = pensioners.filter((p: any) => p.paymentStatus === "AVAILABLE").length;
    const totalAmount = pensioners.reduce((sum: number, p: any) => sum + p.monthlyPension, 0);

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Admin</h1>
                        <p className="text-gray-500">Gestion des Pensions - Décembre 2025</p>
                    </div>
                    <button
                        onClick={fetchPensioners}
                        className="p-2 bg-white rounded-full shadow hover:bg-gray-50"
                    >
                        <RefreshCw className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Retraités</p>
                                <p className="text-2xl font-bold">{pensioners.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Disponibles (Prêts)</p>
                                <p className="text-2xl font-bold">{availableCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <CreditCard className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Montant Total</p>
                                <p className="text-2xl font-bold">{totalAmount.toLocaleString()} XOF</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Section */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Liste des Retraités</h2>

                        <button
                            onClick={handleBulkPayment}
                            disabled={loading}
                            className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${!loading
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <CreditCard className="w-4 h-4" />
                            {loading ? 'Traitement...' : 'Payer les Pensions du Mois'}
                        </button>
                    </div>

                    <table className="w-full">
                        <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Nom</th>
                                <th className="px-6 py-3">Téléphone</th>
                                <th className="px-6 py-3">Montant</th>
                                <th className="px-6 py-3">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pensioners.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                                    <td className="px-6 py-4 text-gray-500">{p.phoneNumber}</td>
                                    <td className="px-6 py-4 text-gray-500">{p.monthlyPension.toLocaleString()} XOF</td>
                                    <td className="px-6 py-4">
                                        {p.paymentStatus === "NOT_PAID" && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                Non Payé
                                            </span>
                                        )}
                                        {p.paymentStatus === "AVAILABLE" && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Disponible
                                            </span>
                                        )}
                                        {p.paymentStatus === "WITHDRAWN" && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Retiré
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Results Console */}
                {paymentResult && (
                    <div className={`p-4 rounded-xl border ${paymentResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <h3 className={`font-bold ${paymentResult.success ? 'text-green-800' : 'text-red-800'}`}>
                            {paymentResult.success ? 'Paiement Réussi !' : 'Erreur de Paiement'}
                        </h3>
                        <pre className="mt-2 text-xs overflow-auto max-h-40 bg-white/50 p-2 rounded">
                            {JSON.stringify(paymentResult, null, 2)}
                        </pre>
                    </div>
                )}

            </div>
        </div>
    );
}
