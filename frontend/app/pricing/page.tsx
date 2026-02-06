// OmniAI - Page Tarifs
'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Check, Sparkles, Zap, Building2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const plans = [
  {
    name: 'Gratuit',
    price: '0',
    period: '',
    description: 'Pour découvrir OmniAI',
    icon: Sparkles,
    color: 'bg-gray-500',
    features: [
      '10 messages chat / jour',
      '5 générations de code / jour',
      '2 images / jour',
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
    color: 'bg-indigo-500',
    features: [
      'Messages chat illimités',
      '100 générations de code / jour',
      '50 images / jour',
      '10 vidéos / jour',
      'Modèles avancés (GPT-4)',
      'Historique des conversations',
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
    color: 'bg-purple-500',
    features: [
      'Tout du plan Pro',
      'Utilisateurs illimités',
      'API dédiée',
      'Vidéos illimitées',
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

export default function PricingPage() {
  const { session } = useAuth()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleSubscribe = async (planName: string) => {
    if (!session) {
      toast.error('Connectez-vous pour souscrire')
      return
    }

    setLoadingPlan(planName)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
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

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Commencez gratuitement et passez à un plan supérieur selon vos besoins
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white dark:bg-gray-900 rounded-2xl border p-6 flex flex-col ${
                plan.popular
                  ? 'border-indigo-500 shadow-lg shadow-indigo-500/10'
                  : 'border-gray-200 dark:border-gray-800'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-medium rounded-full">
                  Populaire
                </div>
              )}

              <div className="mb-6">
                <div className={`w-10 h-10 ${plan.color} rounded-lg flex items-center justify-center mb-4`}>
                  <plan.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}&euro;</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleSubscribe(plan.name)}
                disabled={plan.disabled || loadingPlan === plan.name}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  plan.popular
                    ? 'bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50'
                    : plan.disabled
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-default'
                    : 'border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {loadingPlan === plan.name && <Loader2 className="w-4 h-4 animate-spin" />}
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
