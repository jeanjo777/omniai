// OmniAI - Page d'accueil — Gradient Modern
import { MessageSquare, Code, Image, Video, Sparkles, ArrowRight, Zap, Shield, Globe, Star } from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: MessageSquare,
    title: 'Chat IA',
    description: 'Discutez avec une IA intelligente et obtenez des réponses précises en temps réel',
    href: '/chat',
    gradient: 'from-blue-500 to-cyan-500',
    shadow: 'shadow-blue-500/20',
  },
  {
    icon: Code,
    title: 'Code IA',
    description: 'Générez, corrigez et expliquez du code en quelques secondes avec GPT-4',
    href: '/code',
    gradient: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-500/20',
  },
  {
    icon: Image,
    title: 'Images IA',
    description: 'Créez des images uniques et époustouflantes avec DALL-E 3',
    href: '/image',
    gradient: 'from-violet-500 to-purple-500',
    shadow: 'shadow-violet-500/20',
  },
  {
    icon: Video,
    title: 'Vidéos IA',
    description: "Transformez vos images en vidéos cinématiques avec Higgsfield DoP",
    href: '/video',
    gradient: 'from-orange-500 to-rose-500',
    shadow: 'shadow-orange-500/20',
  },
]

const stats = [
  { icon: Zap, label: 'Ultra Rapide', description: 'Résultats en quelques secondes', gradient: 'from-amber-500 to-orange-500' },
  { icon: Shield, label: 'Sécurisé', description: 'Vos données sont protégées', gradient: 'from-emerald-500 to-teal-500' },
  { icon: Globe, label: 'Accessible 24/7', description: 'Disponible partout dans le monde', gradient: 'from-blue-500 to-indigo-500' },
]

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-28 sm:py-36 px-4 text-center overflow-hidden">
        <div className="relative max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium mb-8 animate-fade-in">
            <Star className="w-3.5 h-3.5" />
            Plateforme IA nouvelle génération
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
            <span className="gradient-text">L&apos;IA tout-en-un</span>
            <br />
            <span className="text-white">pour créer sans limites</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up">
            Chat intelligent, génération de code, création d&apos;images et montage vidéo.
            Quatre outils IA puissants réunis dans une seule plateforme.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link
              href="/chat"
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all duration-300 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 cursor-pointer"
            >
              Commencer gratuitement
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/[0.05] border border-white/[0.1] rounded-xl font-semibold text-gray-200 hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-300 cursor-pointer"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 border-y border-white/[0.06]">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-white text-lg">{stat.label}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-white">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">
            Quatre outils IA puissants réunis dans une seule plateforme
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group relative p-6 rounded-2xl glass-card hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"
              >
                {/* Glow on hover */}
                <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10 blur-sm`} />

                <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg ${feature.shadow}`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
                <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium gradient-text opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Essayer <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="relative max-w-3xl mx-auto text-center overflow-hidden rounded-3xl">
          {/* Gradient border */}
          <div className="absolute -inset-[1px] bg-gradient-to-br from-violet-500/40 via-indigo-500/30 to-cyan-500/40 rounded-3xl" />

          <div className="relative bg-[#0a0520] rounded-3xl p-12 sm:p-16">
            {/* Inner aurora */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-600/15 rounded-full blur-[60px]" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Prêt à commencer ?
              </h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                Créez votre compte gratuitement et accédez à tous nos outils IA.
                Aucune carte de crédit requise.
              </p>
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all duration-300 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 cursor-pointer"
              >
                Créer un compte
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto text-center text-gray-600 text-sm">
          <p>OmniAI &copy; {new Date().getFullYear()} — Propulsé par Next.js, Supabase &amp; Stripe</p>
        </div>
      </footer>
    </main>
  )
}
