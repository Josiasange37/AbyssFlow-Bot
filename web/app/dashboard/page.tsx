'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Droplets,
  Home,
  MessageSquare,
  Users,
  Settings,
  BarChart3,
  Crown,
  Sparkles,
  LogOut,
  Menu,
  X,
  Activity,
  TrendingUp,
  Zap,
  Shield,
  Bell,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

const stats = [
  { label: 'Groupes Actifs', value: '12', change: '+3', icon: <Users className="w-5 h-5" />, color: 'text-blue-500' },
  { label: 'Messages/Jour', value: '2.4K', change: '+12%', icon: <MessageSquare className="w-5 h-5" />, color: 'text-green-500' },
  { label: 'Commandes', value: '156', change: '+8', icon: <Zap className="w-5 h-5" />, color: 'text-yellow-500' },
  { label: 'Uptime', value: '99.9%', change: '24/7', icon: <Activity className="w-5 h-5" />, color: 'text-purple-500' },
]

const recentActivity = [
  { action: 'Broadcast envoyé', group: 'Groupe Tech', time: 'Il y a 5 min', status: 'success' },
  { action: 'Nouveau membre', group: 'Groupe VIP', time: 'Il y a 12 min', status: 'info' },
  { action: 'Commande *tagall', group: 'Groupe Gaming', time: 'Il y a 23 min', status: 'success' },
  { action: 'Membre expulsé', group: 'Groupe Tech', time: 'Il y a 1h', status: 'warning' },
]

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentPlan, setCurrentPlan] = useState('gold')

  const menuItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', href: '/dashboard', active: true },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'Messages', href: '/dashboard/messages' },
    { icon: <Users className="w-5 h-5" />, label: 'Groupes', href: '/dashboard/groups' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Statistiques', href: '/dashboard/stats' },
    { icon: <Settings className="w-5 h-5" />, label: 'Paramètres', href: '/dashboard/settings' },
  ]

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 80 }}
        className="bg-dark-800 border-r border-gray-800 flex flex-col"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Droplets className="w-6 h-6 text-primary-500" />
              <span className="font-bold gradient-text">AbyssFlow</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-dark-700 rounded-lg transition"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                item.active 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-400 hover:bg-dark-700 hover:text-white'
              }`}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Plan Badge */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-800">
            <div className="glass-dark p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {currentPlan === 'pro' ? (
                  <Crown className="w-5 h-5 text-purple-500" />
                ) : (
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                )}
                <span className="font-semibold capitalize">{currentPlan}</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                {currentPlan === 'free' && '1/1 groupe utilisé'}
                {currentPlan === 'gold' && '12/5 groupes'}
                {currentPlan === 'pro' && 'Groupes illimités'}
              </p>
              <Link
                href="/dashboard/upgrade"
                className="block text-center py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm transition"
              >
                Améliorer
              </Link>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="p-4 border-t border-gray-800">
          <button className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-dark-700 rounded-lg transition w-full">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-dark-800 border-b border-gray-800 flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-sm text-gray-400">Bienvenue, Josias Almight</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-dark-700 rounded-lg transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full flex items-center justify-center font-bold">
              JA
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-dark p-6 rounded-xl card-hover"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-dark-700 rounded-lg ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <span className="text-sm text-green-500 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {stat.change}
                  </span>
                </div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-dark p-6 rounded-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Activité Récente</h2>
                <button className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
                  Voir tout
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <div className="font-semibold">{activity.action}</div>
                      <div className="text-sm text-gray-400">{activity.group}</div>
                    </div>
                    <div className="text-xs text-gray-500">{activity.time}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-dark p-6 rounded-xl"
            >
              <h2 className="text-xl font-bold mb-6">Actions Rapides</h2>

              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 bg-dark-700 hover:bg-primary-600 rounded-lg transition text-left">
                  <MessageSquare className="w-6 h-6 mb-2" />
                  <div className="font-semibold">Broadcast</div>
                  <div className="text-xs text-gray-400">Diffuser un message</div>
                </button>

                <button className="p-4 bg-dark-700 hover:bg-green-600 rounded-lg transition text-left">
                  <Users className="w-6 h-6 mb-2" />
                  <div className="font-semibold">Ajouter</div>
                  <div className="text-xs text-gray-400">Nouveau membre</div>
                </button>

                <button className="p-4 bg-dark-700 hover:bg-yellow-600 rounded-lg transition text-left">
                  <Shield className="w-6 h-6 mb-2" />
                  <div className="font-semibold">Anti-Bot</div>
                  <div className="text-xs text-gray-400">Activer protection</div>
                </button>

                <button className="p-4 bg-dark-700 hover:bg-purple-600 rounded-lg transition text-left">
                  <BarChart3 className="w-6 h-6 mb-2" />
                  <div className="font-semibold">Stats</div>
                  <div className="text-xs text-gray-400">Voir détails</div>
                </button>
              </div>

              {/* Bot Status */}
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-green-500">Bot en ligne</span>
                </div>
                <p className="text-sm text-gray-400">
                  Connecté depuis 3 jours, 12 heures
                </p>
              </div>
            </motion.div>
          </div>

          {/* Plan Limitations Warning (for Free users) */}
          {currentPlan === 'free' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 glass-dark p-6 rounded-xl border border-yellow-500/20"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2">Passez à Gold ou Pro</h3>
                  <p className="text-gray-400 mb-4">
                    Débloquez toutes les fonctionnalités: broadcast illimité, plus de groupes, 
                    stickers, anti-bot, et bien plus!
                  </p>
                  <Link
                    href="/dashboard/upgrade"
                    className="inline-block px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 rounded-lg font-semibold transition"
                  >
                    Améliorer maintenant
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}
