'use client'

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
  Lock
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

export default function UpgradePage() {
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
              <span className="gradient-text">Débloquez Tout le Potentiel</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Passez à Gold ou Pro pour accéder à toutes les fonctionnalités et supprimer les limitations
            </p>
          </motion.div>
        </div>

        {/* Current Limitations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-dark p-6 rounded-xl mb-12 border border-red-500/20"
        >
          <h2 className="text-2xl font-bold mb-4 text-red-500">Limitations du Plan Free</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold">1 groupe maximum</p>
                <p className="text-sm text-gray-400">Vous ne pouvez gérer qu'un seul groupe</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold">50 messages/jour</p>
                <p className="text-sm text-gray-400">Limite quotidienne de messages</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold">Pas de broadcast</p>
                <p className="text-sm text-gray-400">Impossible de diffuser des messages</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold">Commandes limitées</p>
                <p className="text-sm text-gray-400">Accès restreint aux commandes premium</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Locked Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {lockedFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
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
              transition={{ delay: 0.3 + index * 0.1 }}
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
                className={`block w-full py-3 ${plan.buttonColor} rounded-lg text-center font-semibold transition flex items-center justify-center gap-2`}
              >
                Passer à {plan.name}
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-dark p-8 rounded-xl"
        >
          <h2 className="text-2xl font-bold mb-6">Questions Fréquentes</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">💳 Quels moyens de paiement acceptez-vous?</h3>
              <p className="text-gray-400">Nous acceptons les cartes bancaires, PayPal, et les cryptomonnaies.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🔄 Puis-je changer de plan?</h3>
              <p className="text-gray-400">Oui, vous pouvez upgrader ou downgrader à tout moment. Les changements sont effectifs immédiatement.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">❌ Puis-je annuler mon abonnement?</h3>
              <p className="text-gray-400">Oui, vous pouvez annuler à tout moment. Aucun remboursement pour le mois en cours.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🛡️ Mes données sont-elles sécurisées?</h3>
              <p className="text-gray-400">Absolument. Nous utilisons un chiffrement de bout en bout et ne stockons aucune donnée sensible.</p>
            </div>
          </div>
        </motion.div>

        {/* Back to Dashboard */}
        <div className="text-center mt-8">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-white transition"
          >
            ← Retour au Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
