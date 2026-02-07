// OmniAI - Navigation Bar — Gradient Modern
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { useCredits } from '@/lib/useCredits'
import {
  Sparkles,
  MessageSquare,
  Code,
  Image,
  Video,
  CreditCard,
  LogOut,
  LogIn,
  Menu,
  X,
  User,
  Coins,
  Plus
} from 'lucide-react'

const navLinks = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/code', label: 'Code', icon: Code },
  { href: '/image', label: 'Images', icon: Image },
  { href: '/video', label: 'Vidéos', icon: Video },
  { href: '/pricing', label: 'Tarifs', icon: CreditCard },
]

export default function Navbar() {
  const pathname = usePathname()
  const { user, logout, loading } = useAuth()
  const { balance, unlimited, loading: creditsLoading } = useCredits()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => pathname === href

  return (
    <nav className="sticky top-0 z-50 bg-white/[0.03] backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow duration-300">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">
              OmniAI
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive(link.href)
                    ? 'bg-violet-500/15 text-violet-300 shadow-lg shadow-violet-500/5'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth / User */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-white/[0.05] animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {/* Credits badge */}
                <Link
                  href="/pricing"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/30 transition-all duration-200 cursor-pointer group"
                  title="Vos points"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  {creditsLoading ? (
                    <span className="text-xs font-medium text-gray-500">...</span>
                  ) : unlimited ? (
                    <span className="text-xs font-bold text-amber-300">&infin;</span>
                  ) : (
                    <span className="text-xs font-bold text-amber-300">{balance.toLocaleString()}</span>
                  )}
                  <span className="text-[10px] text-amber-500/60 font-medium">pts</span>
                  <Plus className="w-3 h-3 text-amber-500/40 group-hover:text-amber-400 transition-colors" />
                </Link>

                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/[0.08] flex items-center justify-center">
                  <User className="w-4 h-4 text-violet-300" />
                </div>
                <span className="text-sm text-gray-400 max-w-[150px] truncate">
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all duration-200 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Connexion
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-white/[0.05] transition-all duration-200 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive(link.href)
                    ? 'bg-violet-500/15 text-violet-300'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}

            <div className="pt-3 border-t border-white/[0.06]">
              {user ? (
                <>
                  <Link
                    href="/pricing"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-amber-300 hover:bg-amber-500/10 transition-all duration-200 cursor-pointer mb-1"
                  >
                    <Coins className="w-4 h-4" />
                    {unlimited ? '∞' : `${balance.toLocaleString()}`} points
                  </Link>
                  <button
                    type="button"
                    onClick={() => { logout(); setMobileOpen(false) }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-violet-300 hover:bg-violet-500/10 transition-all duration-200 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  Connexion
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
