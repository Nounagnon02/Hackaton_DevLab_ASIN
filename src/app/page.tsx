import Link from 'next/link';
import { User, ShieldCheck } from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-2xl mb-12">
                <h1 className="text-5xl font-bold text-green-800 mb-4">BioPension Bénin</h1>
                <p className="text-xl text-gray-600">
                    La solution innovante pour la sécurisation et l'automatisation des pensions de retraite.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Guidage Vocal Fongbé</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">Preuve de Vie Faciale</span>
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">Paiement Mojaloop</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">

                {/* Pensioner Card */}
                <Link href="/pensioner" className="group">
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 h-full flex flex-col items-center text-center">
                        <div className="p-4 bg-green-100 rounded-full mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <User className="w-10 h-10 text-green-700 group-hover:text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Espace Retraité</h2>
                        <p className="text-gray-500">
                            Vérifiez votre identité simplement avec votre voix et votre visage pour recevoir votre pension.
                        </p>
                        <span className="mt-6 text-green-600 font-semibold group-hover:underline">Commencer &rarr;</span>
                    </div>
                </Link>

                {/* Admin Card */}
                <Link href="/admin" className="group">
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 h-full flex flex-col items-center text-center">
                        <div className="p-4 bg-blue-100 rounded-full mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <ShieldCheck className="w-10 h-10 text-blue-700 group-hover:text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Espace Gouvernement</h2>
                        <p className="text-gray-500">
                            Supervisez les preuves de vie et déclenchez les paiements de masse via Mojaloop.
                        </p>
                        <span className="mt-6 text-blue-600 font-semibold group-hover:underline">Accéder au Dashboard &rarr;</span>
                    </div>
                </Link>

            </div>

            <footer className="mt-16 text-gray-400 text-sm">
                Prototype développé pour le Hackathon DevLab 2025
            </footer>
        </div>
    );
}
