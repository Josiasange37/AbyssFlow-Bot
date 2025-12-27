'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import {
  Droplets,
  Mail,
  Lock,
  Phone,
  QrCode,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Smartphone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [method, setMethod] = useState<'qr' | 'phone'>('qr')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState('psychobot://connect?session=demo123')
  const [hasPayment, setHasPayment] = useState(false)
  const [userPlan, setUserPlan] = useState('free')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    name: '',
    botName: '',
    plan: 'free'
  })

  // Check URL params and switch to register mode if needed
  useEffect(() => {
    const modeParam = searchParams.get('mode')
    if (modeParam === 'register') {
      setMode('register')
      setMethod('phone') // Switch to phone/email method for registration
    }
  }, [searchParams])

  // Check payment status on mount
  useEffect(() => {
    const checkPayment = async () => {
      const token = localStorage.getItem('auth-token')
      if (!token) return

      try {
        const response = await fetch(`${process.env.BOT_API_URL}/api/payment/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        setHasPayment(data.hasPayment)

        const user = JSON.parse(localStorage.getItem('user') || '{}')
        setUserPlan(user.plan || 'free')
      } catch (error) {
        console.error('Failed to check payment:', error)
      }
    }
    checkPayment()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const response = await fetch(`${process.env.BOT_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'login' ? {
          email: formData.email,
          password: formData.password
        } : {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          plan: formData.plan
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      // Save token and user data
      localStorage.setItem('auth-token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Check if user has payment
      if (!data.user.hasPayment && data.user.plan === 'free') {
        alert('Compte créé! Vous devez choisir un plan payant pour accéder au bot.')
        window.location.href = '/dashboard/upgrade'
      } else {
        alert(`${mode === 'login' ? 'Connexion' : 'Inscription'} réussie!`)
        window.location.href = '/dashboard'
      }
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'authentification')
    } finally {
      setLoading(false)
    }
  }

  const handleQRConnect = async () => {
    setLoading(true)

    try {
      const token = localStorage.getItem('auth-token')

      if (!token) {
        alert('Vous devez être connecté pour générer un QR Code')
        setLoading(false)
        return
      }

      const response = await fetch(`${process.env.BOT_API_URL}/api/bot/qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403) {
          alert('Paiement requis! Vous devez avoir un plan actif pour accéder au bot.')
          window.location.href = '/dashboard/upgrade'
          return
        }
        throw new Error(data.error || 'Failed to generate QR code')
      }

      setQrCode(data.qrCode)
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la génération du QR Code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Back to Home */}
      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-gray-400 hover:text-white transition"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour
      </Link>

      {/* Login/Register Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark rounded-2xl p-8 w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Droplets className="w-10 h-10 text-primary-500" />
          <span className="text-3xl font-bold gradient-text">Psycho Bot</span>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6 bg-dark-800 p-1 rounded-lg">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-md transition ${mode === 'login'
              ? 'bg-primary-600 text-white'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            Connexion
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-md transition ${mode === 'register'
              ? 'bg-primary-600 text-white'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            Inscription
          </button>
        </div>

        {/* Method Toggle (QR or Phone) */}
        <div className="flex gap-2 mb-6 bg-dark-800 p-1 rounded-lg">
          <button
            onClick={() => setMethod('qr')}
            className={`flex-1 py-2 rounded-md transition flex items-center justify-center gap-2 ${method === 'qr'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            <QrCode className="w-4 h-4" />
            QR Code
          </button>
          <button
            onClick={() => setMethod('phone')}
            className={`flex-1 py-2 rounded-md transition flex items-center justify-center gap-2 ${method === 'phone'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            <Phone className="w-4 h-4" />
            Téléphone
          </button>
        </div>

        {/* QR Code Method */}
        {method === 'qr' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            {!hasPayment || userPlan === 'free' ? (
              // Payment Required Message
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Lock className="w-10 h-10 text-red-500" />
                </div>

                <h3 className="text-2xl font-bold mb-3 text-red-500">Accès Restreint</h3>
                <p className="text-gray-300 mb-6">
                  Le QR Code n'est disponible que pour les utilisateurs avec un plan actif
                </p>

                <div className="bg-dark-800 p-4 rounded-lg mb-6 text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-5 h-5 text-red-500" />
                    <p className="font-semibold text-white">Pour accéder au bot, vous devez:</p>
                  </div>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <p>Avoir un compte (vous l'avez)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <p>Choisir un plan payant (Gold ou Pro)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <p>Valider votre paiement</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/dashboard/upgrade"
                    className="block w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 rounded-lg font-semibold transition"
                  >
                    Choisir un Plan Payant
                  </Link>

                  <p className="text-xs text-gray-500">
                    Plans disponibles: Gold ($9.99/mois) ou Pro ($24.99/mois)
                  </p>
                </div>
              </div>
            ) : (
              // QR Code Display (only if payment active)
              <>
                <div className="bg-white p-6 rounded-xl inline-block mb-4">
                  <QRCodeSVG
                    value={qrCode}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <h3 className="text-xl font-semibold mb-2">Scanner le QR Code</h3>
                <p className="text-gray-400 mb-4">
                  Ouvrez WhatsApp sur votre téléphone et scannez ce code
                </p>

                <div className="space-y-2 text-sm text-gray-400 text-left bg-dark-800 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-5 h-5 text-primary-500" />
                    <p className="font-semibold text-white">Instructions:</p>
                  </div>
                  <p>1. Ouvrez WhatsApp sur votre téléphone</p>
                  <p>2. Appuyez sur Menu (⋮) ou Paramètres</p>
                  <p>3. Sélectionnez "Appareils liés"</p>
                  <p>4. Appuyez sur "Lier un appareil"</p>
                  <p>5. Scannez ce QR code</p>
                </div>

                <button
                  onClick={handleQRConnect}
                  disabled={loading}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-5 h-5" />
                      Générer nouveau QR
                    </>
                  )}
                </button>
              </>
            )}
          </motion.div>
        )}

        {/* Phone/Email Method */}
        {method === 'phone' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom complet</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-800 border border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none transition"
                      placeholder="Josias Almight"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Numéro de téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none transition"
                        placeholder="+237 6XX XXX XXX"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom de ton Bot (Optionnel)</label>
                    <input
                      type="text"
                      value={formData.botName}
                      onChange={(e) => setFormData({ ...formData, botName: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-800 border border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none transition"
                      placeholder="Ex: Psycho Master"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none transition"
                    placeholder="vous@exemple.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-12 pr-12 py-3 bg-dark-800 border border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none transition"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Plan</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-800 border border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none transition"
                  >
                    <option value="free">Free - Gratuit</option>
                    <option value="gold">Gold - $9.99/mois</option>
                    <option value="pro">Pro - $24.99/mois</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 rounded-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 btn-glow"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {mode === 'login' ? 'Connexion...' : 'Inscription...'}
                  </>
                ) : (
                  mode === 'login' ? 'Se connecter' : "S'inscrire"
                )}
              </button>
            </form>

            {mode === 'login' && (
              <div className="mt-4 text-center">
                <a href="#" className="text-sm text-primary-400 hover:text-primary-300">
                  Mot de passe oublié?
                </a>
              </div>
            )}
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-400">
          {mode === 'login' ? (
            <p>
              Pas encore de compte?{' '}
              <button
                onClick={() => setMode('register')}
                className="text-primary-400 hover:text-primary-300"
              >
                S'inscrire
              </button>
            </p>
          ) : (
            <p>
              Déjà un compte?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-primary-400 hover:text-primary-300"
              >
                Se connecter
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
