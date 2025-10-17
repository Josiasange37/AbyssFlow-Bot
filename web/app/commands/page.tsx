'use client'

import { motion } from 'framer-motion'
import { 
  Droplets,
  MessageSquare,
  Users,
  Shield,
  Image,
  Eye,
  Bot,
  Search,
  Download,
  Crown,
  Sparkles,
  Lock,
  Check,
  X,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

const commandCategories = [
  {
    title: 'Commandes Publiques',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-500',
    commands: [
      { 
        name: '*help', 
        aliases: ['*menu', '*commands'],
        description: 'Affiche le menu d\'aide complet avec toutes les commandes disponibles',
        usage: '*help',
        plans: ['free', 'gold', 'pro']
      },
      { 
        name: '*ping', 
        description: 'Vérifie la latence et l\'uptime du bot',
        usage: '*ping',
        plans: ['free', 'gold', 'pro']
      },
      { 
        name: '*about', 
        description: 'Affiche le profil du créateur avec banner Water Hashira',
        usage: '*about',
        plans: ['free', 'gold', 'pro']
      },
      { 
        name: '*links', 
        description: 'Affiche tous les liens sociaux et de contact',
        usage: '*links',
        plans: ['free', 'gold', 'pro']
      },
      { 
        name: '*github', 
        aliases: ['*git'],
        description: 'Recherche un profil GitHub avec stats complètes',
        usage: '*github <username>',
        example: '*github torvalds',
        plans: ['free', 'gold', 'pro']
      },
      { 
        name: '*whoami', 
        description: 'Affiche votre JID WhatsApp et permissions',
        usage: '*whoami',
        plans: ['free', 'gold', 'pro']
      },
      { 
        name: '*search', 
        aliases: ['*google', '*find'],
        description: 'Effectue une recherche Google avec lien direct',
        usage: '*search <requête>',
        example: '*search JavaScript tutorials',
        plans: ['gold', 'pro']
      },
    ]
  },
  {
    title: 'Gestion de Groupe',
    icon: <Users className="w-6 h-6" />,
    color: 'from-green-500 to-emerald-500',
    adminOnly: true,
    commands: [
      { 
        name: '*kick', 
        aliases: ['*remove'],
        description: 'Expulse un ou plusieurs membres du groupe',
        usage: '*kick @user1 @user2',
        plans: ['gold', 'pro']
      },
      { 
        name: '*add', 
        aliases: ['*invite'],
        description: 'Ajoute des membres par numéro de téléphone',
        usage: '*add 237XXXXXXXXX',
        plans: ['gold', 'pro']
      },
      { 
        name: '*promote', 
        description: 'Promouvoir un membre en administrateur',
        usage: '*promote @user',
        plans: ['gold', 'pro']
      },
      { 
        name: '*demote', 
        description: 'Révoquer les droits admin d\'un membre',
        usage: '*demote @admin',
        plans: ['gold', 'pro']
      },
      { 
        name: '*open', 
        description: 'Ouvrir le groupe (tous peuvent écrire)',
        usage: '*open',
        plans: ['gold', 'pro']
      },
      { 
        name: '*close', 
        description: 'Fermer le groupe (seuls admins peuvent écrire)',
        usage: '*close',
        plans: ['gold', 'pro']
      },
      { 
        name: '*tagall', 
        aliases: ['*mentionall', '*everyone'],
        description: 'Mentionner tous les membres du groupe',
        usage: '*tagall [message]',
        example: '*tagall Réunion à 15h!',
        plans: ['gold', 'pro']
      },
      { 
        name: '*welcome', 
        description: 'Configurer les messages de bienvenue automatiques',
        usage: '*welcome on/off',
        plans: ['gold', 'pro']
      },
      { 
        name: '*goodbye', 
        description: 'Configurer les messages de départ automatiques',
        usage: '*goodbye on/off',
        plans: ['gold', 'pro']
      },
    ]
  },
  {
    title: 'Médias & Stickers',
    icon: <Image className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
    commands: [
      { 
        name: '*sticker', 
        aliases: ['*s', '*stiker'],
        description: 'Convertir une image ou vidéo en sticker',
        usage: '*sticker (avec image/vidéo)',
        plans: ['gold', 'pro']
      },
      { 
        name: '*toimage', 
        aliases: ['*toimg', '*topng'],
        description: 'Convertir un sticker en image',
        usage: '*toimage (avec sticker)',
        plans: ['gold', 'pro']
      },
      { 
        name: '*viewonce', 
        description: 'Extraire et afficher un média "vue unique"',
        usage: '*viewonce (répondre à vue unique)',
        plans: ['gold', 'pro']
      },
    ]
  },
  {
    title: 'Protection & Sécurité',
    icon: <Shield className="w-6 h-6" />,
    color: 'from-yellow-500 to-orange-500',
    adminOnly: true,
    commands: [
      { 
        name: '*antibot', 
        description: 'Activer/désactiver la protection anti-bot automatique',
        usage: '*antibot on/off',
        plans: ['gold', 'pro']
      },
      { 
        name: '*botstatus', 
        aliases: ['*botinfo'],
        description: 'Vérifier le statut du bot dans le groupe',
        usage: '*botstatus',
        plans: ['free', 'gold', 'pro']
      },
    ]
  },
  {
    title: 'Commandes Owner',
    icon: <Crown className="w-6 h-6" />,
    color: 'from-red-500 to-rose-500',
    ownerOnly: true,
    commands: [
      { 
        name: '*broadcast', 
        description: 'Diffuser un message à tous les groupes (avec protection anti-ban)',
        usage: '*broadcast <message>',
        plans: ['pro']
      },
      { 
        name: '*stats', 
        description: 'Afficher les statistiques détaillées du bot',
        usage: '*stats',
        plans: ['pro']
      },
      { 
        name: '*block', 
        description: 'Bloquer un utilisateur',
        usage: '*block @user',
        plans: ['pro']
      },
      { 
        name: '*unblock', 
        description: 'Débloquer un utilisateur',
        usage: '*unblock @user',
        plans: ['pro']
      },
      { 
        name: '*join', 
        description: 'Rejoindre un groupe via lien d\'invitation',
        usage: '*join <lien>',
        plans: ['pro']
      },
      { 
        name: '*leave', 
        description: 'Quitter un groupe',
        usage: '*leave',
        plans: ['pro']
      },
    ]
  },
]

const planBadges = {
  free: { label: 'Free', color: 'bg-gray-600', icon: <Droplets className="w-3 h-3" /> },
  gold: { label: 'Gold', color: 'bg-yellow-600', icon: <Sparkles className="w-3 h-3" /> },
  pro: { label: 'Pro', color: 'bg-purple-600', icon: <Crown className="w-3 h-3" /> },
}

export default function CommandsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Droplets className="w-8 h-8 text-primary-500" />
              <span className="text-2xl font-bold gradient-text">AbyssFlow</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
                <ArrowLeft className="w-5 h-5" />
                Retour
              </Link>
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

      {/* Header */}
      <section className="pt-32 pb-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="gradient-text">Toutes les Commandes</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
              Plus de 50 commandes puissantes pour gérer vos groupes WhatsApp. 
              Certaines commandes nécessitent un plan Gold ou Pro.
            </p>

            {/* Plan Legend */}
            <div className="flex gap-4 justify-center flex-wrap">
              <div className="flex items-center gap-2 glass-dark px-4 py-2 rounded-lg">
                <Droplets className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Free - Limité</span>
              </div>
              <div className="flex items-center gap-2 glass-dark px-4 py-2 rounded-lg">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Gold - Recommandé</span>
              </div>
              <div className="flex items-center gap-2 glass-dark px-4 py-2 rounded-lg">
                <Crown className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Pro - Illimité</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Commands List */}
      <section className="pb-20 px-4">
        <div className="max-w-7xl mx-auto space-y-12">
          {commandCategories.map((category, catIndex) => (
            <motion.div
              key={catIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIndex * 0.1 }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 bg-gradient-to-r ${category.color} rounded-lg`}>
                  {category.icon}
                </div>
                <div>
                  <h2 className="text-3xl font-bold">{category.title}</h2>
                  {category.adminOnly && (
                    <p className="text-sm text-yellow-500">⚠️ Réservé aux admins et owners</p>
                  )}
                  {category.ownerOnly && (
                    <p className="text-sm text-red-500">👑 Réservé aux owners uniquement</p>
                  )}
                </div>
              </div>

              {/* Commands Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {category.commands.map((command, cmdIndex) => (
                  <motion.div
                    key={cmdIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (catIndex * 0.1) + (cmdIndex * 0.05) }}
                    className="glass-dark p-6 rounded-xl hover:border-primary-500/50 border border-transparent transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-primary-400 mb-1">
                          {command.name}
                        </h3>
                        {command.aliases && (
                          <p className="text-sm text-gray-500">
                            Alias: {command.aliases.join(', ')}
                          </p>
                        )}
                      </div>
                      
                      {/* Plan Badges */}
                      <div className="flex gap-1">
                        {command.plans.map((plan) => (
                          <div
                            key={plan}
                            className={`${planBadges[plan as keyof typeof planBadges].color} px-2 py-1 rounded text-xs flex items-center gap-1`}
                          >
                            {planBadges[plan as keyof typeof planBadges].icon}
                            {planBadges[plan as keyof typeof planBadges].label}
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-gray-300 mb-4">{command.description}</p>

                    <div className="space-y-2">
                      <div className="bg-dark-800 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Utilisation:</p>
                        <code className="text-sm text-green-400">{command.usage}</code>
                      </div>
                      
                      {command.example && (
                        <div className="bg-dark-800 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Exemple:</p>
                          <code className="text-sm text-blue-400">{command.example}</code>
                        </div>
                      )}
                    </div>

                    {/* Lock indicator for premium commands */}
                    {!command.plans.includes('free') && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-yellow-500">
                        <Lock className="w-4 h-4" />
                        <span>Nécessite un plan payant</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-dark-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-dark p-12 rounded-2xl"
          >
            <Lock className="w-16 h-16 mx-auto mb-6 text-primary-500" />
            <h2 className="text-4xl font-bold mb-4">Débloquez Toutes les Commandes</h2>
            <p className="text-gray-400 text-lg mb-8">
              Créez un compte et choisissez un plan pour accéder à toutes les fonctionnalités
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/login"
                className="px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 rounded-lg text-lg font-semibold btn-glow transition"
              >
                Créer un Compte
              </Link>
              <Link
                href="/#pricing"
                className="px-8 py-4 border border-primary-600 hover:bg-primary-600/10 rounded-lg text-lg font-semibold transition"
              >
                Voir les Tarifs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
