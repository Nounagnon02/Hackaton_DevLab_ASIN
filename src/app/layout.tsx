import type { Metadata } from 'next'
import './globals.css'
import { AI } from './actions'

export const metadata: Metadata = {
    title: 'BioPension Bénin',
    description: 'Solution innovante de paiement de masse des pensions avec preuve de vie biométrique',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="fr">
            <body>
                <AI>
                    {children}
                </AI>
            </body>
        </html>
    )
}
