'use client'

import { motion } from 'framer-motion'
import { 
  Droplets,
  Github,
  Linkedin,
  Twitter,
  Mail,
  Globe,
  Code,
  Zap,
  Heart,
  ArrowLeft,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

const creator = {
  name: 'Josias Almight',
  role: 'Founder & Lead Developer',
  bio: 'Développeur Full-Stack passionné par l\'automation et l\'intelligence artificielle. Créateur d\'AbyssFlow, le bot WhatsApp le plus puissant du marché.',
  avatar: 'JA',
  links: {
    github: 'https://github.com/Josiasange37',
    linkedin: 'https://www.linkedin.com/in/thealmight',
    twitter: 'https://twitter.com/AlmightJosias',
    portfolio: 'https://almightportfolio.vercel.app/',
    email: 'contact@almight.tech',
  },
  stats: [
    { label: 'Projets', value: '50+' },
    { label: 'Utilisateurs', value: '10K+' },
    { label: 'Commits', value: '5K+' },
    { label: 'Expérience', value: '5 ans' },
  ]
}

const team = [
  {
    name: 'Xyber Clan',
    role: 'Startup Partenaire',
    description: 'Startup technologique spécialisée dans le développement d\'outils d\'automation et d\'IA',
    avatar: 'XC',
    link: 'https://xyber-clan.vercel.app/',
    color: 'from-blue-500 to-cyan-500'
  },
]

const technologies = [
  { name: 'Node.js', icon: '🟢', description: 'Backend puissant' },
  { name: 'Baileys', icon: '📱', description: 'WhatsApp Web API' },
  { name: 'Next.js', icon: '⚡', description: 'Frontend moderne' },
  { name: 'TypeScript', icon: '💙', description: 'Type safety' },
  { name: 'TailwindCSS', icon: '🎨', description: 'Design system' },
  { name: 'Framer Motion', icon: '✨', description: 'Animations' },
]

const achievements = [
  {
    title: '10,000+ Utilisateurs',
    description: 'Plus de 10,000 utilisateurs actifs dans le monde entier',
    icon: '👥',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    title: '99.9% Uptime',
    description: 'Disponibilité garantie 24/7 avec infrastructure robuste',
    icon: '⚡',
    color: 'from-green-500 to-emerald-500'
  },
  {
    title: '50+ Commandes',
    description: 'Plus de 50 commandes puissantes pour tous vos besoins',
    icon: '🚀',
    color: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Open Source',
    description: 'Code source disponible sur GitHub pour la communauté',
    icon: '💻',
    color: 'from-yellow-500 to-orange-500'
  },
]

export default function AboutPage() {
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

      {/* Hero */}
      <section className="pt-32 pb-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="gradient-text">À Propos d'AbyssFlow</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
              Le bot WhatsApp le plus puissant, créé avec passion par des développeurs pour des développeurs
            </p>
          </motion.div>
        </div>
      </section>

      {/* Creator Section */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-dark p-8 md:p-12 rounded-2xl"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Avatar */}
              <div className="text-center md:text-left">
                <div className="w-48 h-48 mx-auto md:mx-0 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full flex items-center justify-center text-6xl font-bold mb-6">
                  {creator.avatar}
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  {creator.stats.map((stat, index) => (
                    <div key={index} className="bg-dark-800 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-primary-500">{stat.value}</div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div>
                <h2 className="text-3xl font-bold mb-2">{creator.name}</h2>
                <p className="text-primary-400 text-lg mb-4">{creator.role}</p>
                <p className="text-gray-300 mb-6">{creator.bio}</p>

                {/* Social Links */}
                <div className="flex flex-wrap gap-3">
                  <a
                    href={creator.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition"
                  >
                    <Github className="w-5 h-5" />
                    <span>GitHub</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href={creator.links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition"
                  >
                    <Linkedin className="w-5 h-5" />
                    <span>LinkedIn</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href={creator.links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition"
                  >
                    <Twitter className="w-5 h-5" />
                    <span>Twitter</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href={creator.links.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition"
                  >
                    <Globe className="w-5 h-5" />
                    <span>Portfolio</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href={`mailto:${creator.links.email}`}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Email</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Notre Équipe</h2>
            <p className="text-gray-400 text-lg">Les partenaires qui rendent tout cela possible</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member, index) => (
              <motion.a
                key={index}
                href={member.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-dark p-6 rounded-xl card-hover"
              >
                <div className={`w-20 h-20 bg-gradient-to-r ${member.color} rounded-full flex items-center justify-center text-2xl font-bold mb-4`}>
                  {member.avatar}
                </div>
                <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                <p className="text-primary-400 text-sm mb-3">{member.role}</p>
                <p className="text-gray-400 text-sm">{member.description}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Technologies */}
      <section className="py-12 px-4 bg-dark-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Technologies Utilisées</h2>
            <p className="text-gray-400 text-lg">Stack technologique moderne et performant</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {technologies.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="glass-dark p-6 rounded-xl text-center hover:scale-105 transition"
              >
                <div className="text-4xl mb-3">{tech.icon}</div>
                <h3 className="font-bold mb-1">{tech.name}</h3>
                <p className="text-xs text-gray-400">{tech.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Nos Réalisations</h2>
            <p className="text-gray-400 text-lg">Ce que nous avons accompli ensemble</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-dark p-6 rounded-xl text-center"
              >
                <div className="text-5xl mb-4">{achievement.icon}</div>
                <h3 className="text-xl font-bold mb-2">{achievement.title}</h3>
                <p className="text-gray-400 text-sm">{achievement.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4 bg-dark-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-dark p-12 rounded-2xl"
          >
            <Heart className="w-16 h-16 mx-auto mb-6 text-red-500" />
            <h2 className="text-4xl font-bold mb-4">Notre Mission</h2>
            <p className="text-gray-300 text-lg mb-6">
              Rendre l'automation WhatsApp accessible à tous, avec des outils puissants, 
              sécurisés et faciles à utiliser. Nous croyons en la technologie au service 
              de l'humain, et nous nous efforçons de créer des solutions qui simplifient 
              la vie de nos utilisateurs.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/login"
                className="px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 rounded-lg text-lg font-semibold btn-glow transition"
              >
                Rejoignez-nous
              </Link>
              <a
                href={creator.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 border border-primary-600 hover:bg-primary-600/10 rounded-lg text-lg font-semibold transition flex items-center gap-2"
              >
                <Github className="w-5 h-5" />
                GitHub
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
