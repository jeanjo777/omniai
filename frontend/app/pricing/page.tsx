// OmniAI - Page Tarifs — Gradient Modern + Packs de Points
'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useCredits } from '@/lib/useCredits'
import { Check, Sparkles, Zap, Building2, Loader2, Coins, Package, Star, Flame } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const plans = [
  {
    name: 'Gratuit',
    price: '0',
    period: '',
    description: 'Pour découvrir OmniAI',
    icon: Sparkles,
    gradient: 'from-gray-500 to-gray-600',
    features: [
      '100 points à l\'inscription',
      'Chat IA illimité et gratuit',
      'Code IA (1 pt/action)',
      'Images IA (3 pts/image)',
      'Modèles standards',
    ],
    cta: 'Plan actuel',
    popular: false,
    disabled: true,
  },
  {
    name: 'Pro',
    price: '19',
    period: '/mois',
    description: 'Pour les professionnels',
    icon: Zap,
    gradient: 'from-violet-500 to-indigo-500',
    features: [
      '5 000 points / mois',
      'Points cumulatifs',
      'Chat IA illimité et gratuit',
      'Code IA (1 pt/action)',
      'Images IA (3 pts/image)',
      'Vidéos IA (5 pts/vidéo)',
      'Modèles avancés (GPT-4)',
      'Support prioritaire',
    ],
    cta: 'Commencer',
    popular: true,
    disabled: false,
  },
  {
    name: 'Enterprise',
    price: '99',
    period: '/mois',
    description: 'Pour les équipes',
    icon: Building2,
    gradient: 'from-cyan-500 to-blue-500',
    features: [
      'Points illimités',
      'Tout du plan Pro',
      'Utilisateurs illimités',
      'API dédiée',
      'Modèles personnalisés',
      'SLA garanti',
      'Support dédié 24/7',
      'Facturation annuelle',
    ],
    cta: 'Nous contacter',
    popular: false,
    disabled: false,
  },
]

const creditPacks = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 500,
    price: '4.99',
    icon: Package,
    gradient: 'from-emerald-500 to-teal-500',
    popular: false,
  },
  {
    id: 'popular',
    name: 'Popular',
    credits: 2000,
    price: '14.99',
    icon: Star,
    gradient: 'from-amber-500 to-orange-500',
    popular: true,
  },
  {
    id: 'mega',
    name: 'Mega',
    credits: 5000,
    price: '29.99',
    icon: Flame,
    gradient: 'from-rose-500 to-pink-500',
    popular: false,
  },
]

export default function PricingPage() {
  const { session } = useAuth()
  const { balance, unlimited, loading: creditsLoading } = useCredits()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [loadingPack, setLoadingPack] = useState<string | null>(null)

  const handleSubscribe = async (planName: string) => {
    if (!session) {
      toast.error('Connectez-vous pour souscrire')
      return
    }

    setLoadingPlan(planName)
    try {
      const res = await fetch(`${API_URL}/api/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: planName.toLowerCase() }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.error) {
        throw new Error(data.error)
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la souscription')
    }
    setLoadingPlan(null)
  }

  const handleBuyPack = async (packId: string) => {
    if (!session) {
      toast.error('Connectez-vous pour acheter des points')
      return
    }

    setLoadingPack(packId)
    try {
      const res = await fetch(`${API_URL}/api/credits/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ packId }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.error) {
        throw new Error(data.error)
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'achat')
    }
    setLoadingPack(null)
  }

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-14 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
            Choisissez votre plan
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Commencez gratuitement et passez à un plan supérieur selon vos besoins
          </p>

          {/* Current balance display */}
          {session && !creditsLoading && (
            <div className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-gray-300">Votre solde :</span>
              <span className="text-lg font-bold text-amber-300">
                {unlimited ? '∞' : balance.toLocaleString()}
              </span>
              <span className="text-xs text-amber-500/60 font-medium">points</span>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 animate-slide-up">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="relative rounded-2xl overflow-hidden"
            >
              {/* Glow border for popular */}
              <div className={`absolute -inset-[1px] rounded-2xl ${
                plan.popular
                  ? 'bg-gradient-to-br from-violet-500/40 via-indigo-500/30 to-cyan-500/40'
                  : 'bg-gradient-to-br from-white/[0.06] to-white/[0.02]'
              }`} />

              <div className="relative glass-card p-6 flex flex-col h-full">
                {plan.popular && (
                  <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold rounded-b-lg shadow-lg shadow-violet-500/20">
                    Populaire
                  </div>
                )}

                <div className="mb-6 pt-2">
                  <div className={`w-11 h-11 bg-gradient-to-br ${plan.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <plan.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">{plan.price}$</span>
                  <span className="text-sm text-gray-500 ml-1">CAD</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={plan.disabled || loadingPlan === plan.name}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 cursor-pointer ${
                    plan.popular
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 disabled:opacity-50'
                      : plan.disabled
                      ? 'bg-white/[0.03] text-gray-600 cursor-default border border-white/[0.06]'
                      : 'bg-white/[0.05] text-gray-300 border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12]'
                  }`}
                >
                  {loadingPlan === plan.name && <Loader2 className="w-4 h-4 animate-spin" />}
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Credit Packs Section */}
        <div className="mt-20 animate-slide-up">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-medium mb-4">
              <Coins className="w-3.5 h-3.5" />
              Packs de points
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Besoin de plus de points ?
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto">
              Achetez des packs de points supplémentaires. Les points sont cumulatifs et n&apos;expirent jamais.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {creditPacks.map((pack) => (
              <div
                key={pack.id}
                className="relative rounded-2xl overflow-hidden"
              >
                <div className={`absolute -inset-[1px] rounded-2xl ${
                  pack.popular
                    ? 'bg-gradient-to-br from-amber-500/40 via-orange-500/30 to-rose-500/40'
                    : 'bg-gradient-to-br from-white/[0.06] to-white/[0.02]'
                }`} />

                <div className="relative glass-card p-6 text-center">
                  {pack.popular && (
                    <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-[10px] font-semibold rounded-b-lg">
                      Meilleur rapport
                    </div>
                  )}

                  <div className={`w-12 h-12 mx-auto bg-gradient-to-br ${pack.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg mt-2`}>
                    <pack.icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{pack.name}</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-1">
                    <span className="text-3xl font-bold text-amber-300">{pack.credits.toLocaleString()}</span>
                    <span className="text-sm text-amber-500/60 font-medium">pts</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-5">{pack.price}$ CAD</p>

                  <button
                    type="button"
                    onClick={() => handleBuyPack(pack.id)}
                    disabled={loadingPack === pack.id}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 cursor-pointer ${
                      pack.popular
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 disabled:opacity-50'
                        : 'bg-white/[0.05] text-gray-300 border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] disabled:opacity-50'
                    }`}
                  >
                    {loadingPack === pack.id && <Loader2 className="w-4 h-4 animate-spin" />}
                    Acheter
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cost breakdown */}
          <div className="mt-12 max-w-lg mx-auto">
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
              <div className="relative glass-card p-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 text-center">Coût par utilisation</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Chat IA', cost: 'Gratuit', color: 'text-emerald-400' },
                    { label: 'Code IA', cost: '1 pt', color: 'text-blue-400' },
                    { label: 'Image IA', cost: '3 pts', color: 'text-violet-400' },
                    { label: 'Vidéo IA', cost: '5 pts', color: 'text-orange-400' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02]">
                      <span className="text-sm text-gray-400">{item.label}</span>
                      <span className={`text-sm font-semibold ${item.color}`}>{item.cost}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
