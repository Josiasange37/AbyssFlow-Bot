'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Droplets, 
  MessageSquare, 
  Shield, 
  Zap, 
  Users, 
  Check,
  ArrowRight,
  Sparkles,
  Crown,
  Rocket
} from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'Messages Automatiques',
    description: 'Bienvenue, départ, et diffusions personnalisées'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Protection Anti-Ban',
    description: 'Simulation humaine et délais intelligents'
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Gestion de Groupe',
    description: 'Kick, promote, tagall et bien plus'
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Performances Élevées',
    description: 'Réponses rapides et timeouts intelligents'
  },
]

const plans = [
  {
    name: 'Free',
    icon: <Droplets className="w-8 h-8" />,
    price: '0',
    period: '/mois',
    description: 'Parfait pour tester',
    features: [
      '1 groupe maximum',
      'Commandes de base',
      'Support communautaire',
      'Limité à 50 msg/jour',
      'Pas de broadcast',
    ],
    limitations: [
      'viewonce',
      'antibot',
      'tagall',
      'broadcast',
      'sticker'
    ],
    color: 'from-gray-600 to-gray-800',
    buttonColor: 'bg-gray-600 hover:bg-gray-700'
  },
  {
    name: 'Gold',
    icon: <Sparkles className="w-8 h-8" />,
    price: '9.99',
    period: '/mois',
    description: 'Pour les utilisateurs sérieux',
    popular: true,
    features: [
      '5 groupes maximum',
      'Toutes les commandes',
      'Support prioritaire',
      'Limité à 500 msg/jour',
      'Broadcast (3x/jour)',
      'Stickers illimités',
      'Anti-bot protection',
    ],
    color: 'from-yellow-500 to-orange-600',
    buttonColor: 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700'
  },
  {
    name: 'Pro',
    icon: <Crown className="w-8 h-8" />,
    price: '24.99',
    period: '/mois',
    description: 'Pour les professionnels',
    features: [
      'Groupes illimités',
      'Toutes les commandes',
      'Support 24/7',
      'Messages illimités',
      'Broadcast illimité',
      'API Access',
      'White-label option',
      'Analytics avancées',
      'Personnalisation complète',
    ],
    color: 'from-purple-600 to-pink-600',
    buttonColor: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
  },
]

export default function Home() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  return (
    <main className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Droplets className="w-8 h-8 text-primary-500" />
              <span className="text-2xl font-bold gradient-text">AbyssFlow</span>
            </motion.div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="hover:text-primary-400 transition">Fonctionnalités</a>
              <Link href="/commands" className="hover:text-primary-400 transition">Commandes</Link>
              <a href="#pricing" className="hover:text-primary-400 transition">Tarifs</a>
              <Link href="/about" className="hover:text-primary-400 transition">À Propos</Link>
              <Link 
                href="/login" 
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition btn-glow"
              >
                Connexion
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">WhatsApp Bot</span>
              <br />
              Professionnel
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Gérez vos groupes WhatsApp avec puissance et élégance. 
              Automation complète, protection anti-ban, et bien plus.
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/login"
                className="px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 rounded-lg text-lg font-semibold flex items-center gap-2 btn-glow transition"
              >
                Commencer Maintenant
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a 
                href="#features"
                className="px-8 py-4 border border-primary-600 hover:bg-primary-600/10 rounded-lg text-lg font-semibold transition"
              >
                En Savoir Plus
              </a>
            </div>
          </motion.div>

          {/* Floating Animation */}
          <motion.div
            className="mt-16 relative"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="glass p-8 rounded-2xl max-w-4xl mx-auto">
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-primary-500">50+</div>
                  <div className="text-gray-400">Commandes</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary-500">99.9%</div>
                  <div className="text-gray-400">Uptime</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary-500">24/7</div>
                  <div className="text-gray-400">Support</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Fonctionnalités Puissantes</h2>
            <p className="text-gray-400 text-lg">Tout ce dont vous avez besoin pour gérer vos groupes</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="glass-dark p-6 rounded-xl card-hover cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className={`p-3 bg-primary-600/20 rounded-lg inline-block mb-4 transition ${hoveredFeature === index ? 'scale-110' : ''}`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-dark-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Choisissez Votre Plan</h2>
            <p className="text-gray-400 text-lg">Des options pour chaque besoin et budget</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                className={`glass-dark p-8 rounded-2xl relative overflow-hidden ${plan.popular ? 'ring-2 ring-primary-500' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                    Populaire
                  </div>
                )}

                <div className={`inline-block p-3 bg-gradient-to-r ${plan.color} rounded-lg mb-4`}>
                  {plan.icon}
                </div>

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-400 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-5xl font-bold">${plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={`block w-full py-3 ${plan.buttonColor} rounded-lg text-center font-semibold transition`}
                >
                  Choisir {plan.name}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-dark p-12 rounded-2xl"
          >
            <Rocket className="w-16 h-16 mx-auto mb-6 text-primary-500" />
            <h2 className="text-4xl font-bold mb-4">Prêt à Commencer?</h2>
            <p className="text-gray-400 text-lg mb-8">
              Rejoignez des centaines d'utilisateurs qui font confiance à AbyssFlow
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 rounded-lg text-lg font-semibold btn-glow transition"
            >
              Créer un Compte Gratuit
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Droplets className="w-6 h-6 text-primary-500" />
                <span className="text-xl font-bold">AbyssFlow</span>
              </div>
              <p className="text-gray-400">
                WhatsApp Bot professionnel propulsé par Water Hashira
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-primary-400">Fonctionnalités</a></li>
                <li><Link href="/commands" className="hover:text-primary-400">Commandes</Link></li>
                <li><a href="#pricing" className="hover:text-primary-400">Tarifs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-primary-400">À propos</Link></li>
                <li><a href="mailto:contact@almight.tech" className="hover:text-primary-400">Contact</a></li>
                <li><a href="https://github.com/Josiasange37" target="_blank" rel="noopener noreferrer" className="hover:text-primary-400">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-primary-400">Confidentialité</a></li>
                <li><a href="#" className="hover:text-primary-400">Conditions</a></li>
                <li><a href="#" className="hover:text-primary-400">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 AbyssFlow by Josias Almight. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
