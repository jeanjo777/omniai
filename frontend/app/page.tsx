// OmniAI - Page d'accueil
import { MessageSquare, Code, Image, Video, Sparkles, ArrowRight, Zap, Shield, Globe } from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: MessageSquare,
    title: 'Chat IA',
    description: 'Discutez avec une IA intelligente et obtenez des réponses précises',
    href: '/chat',
    color: 'bg-blue-500',
  },
  {
    icon: Code,
    title: 'Code IA',
    description: 'Générez, corrigez et expliquez du code en quelques secondes',
    href: '/code',
    color: 'bg-green-500',
  },
  {
    icon: Image,
    title: 'Images IA',
    description: 'Créez des images uniques avec DALL-E 3',
    href: '/image',
    color: 'bg-purple-500',
  },
  {
    icon: Video,
    title: 'Vidéos IA',
    description: "Générez et éditez des vidéos avec l'IA",
    href: '/video',
    color: 'bg-orange-500',
  },
]

const stats = [
  { icon: Zap, label: 'Rapide', description: 'Résultats en quelques secondes' },
  { icon: Shield, label: 'Sécurisé', description: 'Vos données sont protégées' },
  { icon: Globe, label: 'Accessible', description: 'Disponible partout, 24/7' },
]

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="w-10 h-10 text-indigo-500" />
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              OmniAI
            </h1>
          </div>

          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Plateforme IA tout-en-un : Chat intelligent, génération de code,
            création d&apos;images et montage vidéo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors cursor-pointer"
            >
              Commencer gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-gray-300 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-y border-gray-100 dark:border-gray-800/50">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
              <p className="font-semibold">{stat.label}</p>
              <p className="text-sm text-gray-500">{stat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            Quatre outils IA puissants réunis dans une seule plateforme
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:shadow-lg cursor-pointer bg-white dark:bg-gray-900/50"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
                <span className="inline-flex items-center gap-1 mt-4 text-sm text-indigo-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Essayer <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">
            Créez votre compte gratuitement et accédez à tous nos outils IA.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Créer un compte
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>OmniAI &copy; {new Date().getFullYear()} - Propulsé par Next.js, Supabase &amp; Stripe</p>
        </div>
      </footer>
    </main>
  )
}
