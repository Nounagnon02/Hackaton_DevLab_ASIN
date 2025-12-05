import type { Metadata } from 'next'
import { Inter, Nunito } from 'next/font/google'
import './globals.css'
import { AI } from './actions'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
})

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
            <body className={`${inter.variable} ${nunito.variable}`}>
                <AI>
                    {children}
                </AI>
            </body>
        </html>
    )
}
