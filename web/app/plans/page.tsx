'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Crown,
  Sparkles,
  Check,
  X,
  Zap,
  Shield,
  Users,
  MessageSquare,
  ArrowRight,
  Lock,
  LogIn,
  CreditCard,
  RefreshCw,
  XCircle,
  ShieldCheck
} from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: 'Gold',
    icon: <Sparkles className="w-8 h-8" />,
    price: '9.99',
    period: '/mois',
    description: 'Parfait pour les utilisateurs sérieux',
    popular: true,
    features: [
      { text: '5 groupes maximum', included: true },
      { text: 'Toutes les commandes', included: true },
      { text: 'Support prioritaire', included: true },
      { text: '500 messages/jour', included: true },
      { text: 'Broadcast (3x/jour)', included: true },
      { text: 'Stickers illimités', included: true },
      { text: 'Anti-bot protection', included: true },
      { text: 'API Access', included: false },
      { text: 'White-label', included: false },
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
      { text: 'Groupes illimités', included: true },
      { text: 'Toutes les commandes', included: true },
      { text: 'Support 24/7', included: true },
      { text: 'Messages illimités', included: true },
      { text: 'Broadcast illimité', included: true },
      { text: 'Stickers illimités', included: true },
      { text: 'Anti-bot protection', included: true },
      { text: 'API Access', included: true },
      { text: 'White-label option', included: true },
    ],
    color: 'from-purple-600 to-pink-600',
    buttonColor: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
  },
]

const lockedFeatures = [
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'Broadcast Illimité',
    description: 'Diffusez des messages à tous vos groupes sans limite'
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Plus de Groupes',
    description: 'Gérez jusqu\'à 5 groupes (Gold) ou illimité (Pro)'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Protection Anti-Bot',
    description: 'Expulsez automatiquement les bots indésirables'
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Commandes Premium',
    description: 'Accédez à toutes les commandes avancées'
  },
]

export default function PlansPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  useEffect(() => {
    const token = localStorage.getItem('auth-token')
    setIsAuthenticated(!!token)
  }, [])
  
  const handleSelectPlan = (planName: string) => {
    if (!isAuthenticated) {
      // Redirect to login page in register mode
      window.location.href = '/login?mode=register'
    } else {
      window.location.href = '/dashboard/upgrade'
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-block p-4 bg-yellow-500/20 rounded-full mb-4">
              <Lock className="w-12 h-12 text-yellow-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Choisissez Votre Plan</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
              Passez à Gold ou Pro pour accéder à toutes les fonctionnalités et supprimer les limitations
            </p>
            
            {!isAuthenticated && (
              <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 px-6 py-3 rounded-lg">
                <LogIn className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400">Créez un compte pour choisir un plan</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Locked Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {lockedFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="glass-dark p-6 rounded-xl"
            >
              <div className="p-3 bg-primary-600/20 rounded-lg inline-block mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={`glass-dark p-8 rounded-2xl relative overflow-hidden ${
                plan.popular ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                  Recommandé
                </div>
              )}

              <div className={`inline-block p-3 bg-gradient-to-r ${plan.color} rounded-lg mb-4`}>
                {plan.icon}
              </div>

              <h3 className="text-3xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-400 mb-6">{plan.description}</p>

              <div className="mb-6">
                <span className="text-5xl font-bold">${plan.price}</span>
                <span className="text-gray-400">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-2">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? 'text-gray-300' : 'text-gray-600'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.name)}
                className={`block w-full py-3 ${plan.buttonColor} rounded-lg text-center font-semibold transition flex items-center justify-center gap-2`}
              >
                {isAuthenticated ? `Passer à ${plan.name}` : 'Créer un compte'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-dark p-8 rounded-xl"
        >
          <h2 className="text-2xl font-bold mb-6">Questions Fréquentes</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold">Quels moyens de paiement acceptez-vous?</h3>
              </div>
              <p className="text-gray-400">Nous acceptons les cartes bancaires, PayPal, et les cryptomonnaies.</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold">Puis-je changer de plan?</h3>
              </div>
              <p className="text-gray-400">Oui, vous pouvez upgrader ou downgrader à tout moment. Les changements sont effectifs immédiatement.</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold">Puis-je annuler mon abonnement?</h3>
              </div>
              <p className="text-gray-400">Oui, vous pouvez annuler à tout moment. Aucun remboursement pour le mois en cours.</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold">Mes données sont-elles sécurisées?</h3>
              </div>
              <p className="text-gray-400">Absolument. Nous utilisons un chiffrement de bout en bout et ne stockons aucune donnée sensible.</p>
            </div>
          </div>
        </motion.div>

        {/* Back to Home */}
        <div className="text-center mt-8 space-y-4">
          {!isAuthenticated && (
            <Link
              href="/login?mode=register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold transition"
            >
              <LogIn className="w-5 h-5" />
              Créer un compte pour continuer
            </Link>
          )}
          <div>
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
