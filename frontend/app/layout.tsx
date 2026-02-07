// OmniAI - Layout principal
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/components/AuthProvider'
import Navbar from '@/components/Navbar'

const font = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'OmniAI - Plateforme IA Multimédia',
  description: 'Chat IA, génération de code, images et vidéos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className={font.className}>
        {/* Aurora Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[#030014]" />
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[120px] animate-aurora-1" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] animate-aurora-2" />
          <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-[100px] animate-aurora-3" />
        </div>

        <AuthProvider>
          <Navbar />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
              },
            }}
          />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
