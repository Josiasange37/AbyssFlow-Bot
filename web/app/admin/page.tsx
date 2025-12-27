'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Droplets,
    Users,
    Activity,
    Power,
    Trash2,
    RefreshCw,
    Search,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
    const [sessions, setSessions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        total: 0,
        online: 0,
        offline: 0
    })

    const fetchSessions = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('auth-token')
            const response = await fetch('http://localhost:3001/api/admin/sessions', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()
            if (Array.isArray(data)) {
                setSessions(data)
                setStats({
                    total: data.length,
                    online: data.filter((s: any) => s.status === 'CONNECTED').length,
                    offline: data.filter((s: any) => s.status !== 'CONNECTED').length
                })
            }
        } catch (error) {
            console.error('Failed to fetch sessions:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSessions()
        const interval = setInterval(fetchSessions, 10000)
        return () => clearInterval(interval)
    }, [])

    const stopSession = async (id: string) => {
        if (!confirm(`Are you sure you want to stop session ${id}?`)) return
        try {
            const token = localStorage.getItem('auth-token')
            await fetch(`http://localhost:3001/api/sessions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            fetchSessions()
        } catch (error) {
            alert('Failed to stop session')
        }
    }

    return (
        <div className="min-h-screen bg-dark-900 text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-3">
                        <Droplets className="w-10 h-10 text-primary-500" />
                        <div>
                            <h1 className="text-3xl font-bold gradient-text">Psycho Bot Factory</h1>
                            <p className="text-gray-400">Admin Control Center</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={fetchSessions}
                            className="p-3 bg-dark-800 rounded-lg hover:bg-dark-700 transition"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <Link href="/" className="px-6 py-3 bg-primary-600 rounded-lg font-semibold">
                            Back to Site
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="glass-dark p-6 rounded-2xl">
                        <div className="flex items-center gap-4 mb-2">
                            <Users className="w-6 h-6 text-blue-500" />
                            <h3 className="text-gray-400 font-medium">Total Sessions</h3>
                        </div>
                        <p className="text-4xl font-bold">{stats.total}</p>
                    </div>
                    <div className="glass-dark p-6 rounded-2xl border-l-4 border-green-500">
                        <div className="flex items-center gap-4 mb-2">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            <h3 className="text-gray-400 font-medium">Online</h3>
                        </div>
                        <p className="text-4xl font-bold text-green-500">{stats.online}</p>
                    </div>
                    <div className="glass-dark p-6 rounded-2xl border-l-4 border-red-500">
                        <div className="flex items-center gap-4 mb-2">
                            <XCircle className="w-6 h-6 text-red-500" />
                            <h3 className="text-gray-400 font-medium">Offline</h3>
                        </div>
                        <p className="text-4xl font-bold text-red-500">{stats.offline}</p>
                    </div>
                </div>

                {/* Search & Filter bar (Mock) */}
                <div className="glass-dark p-4 rounded-xl mb-8 flex items-center gap-4">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search sessions by user ID..."
                        className="bg-transparent border-none focus:ring-0 text-white w-full"
                    />
                </div>

                {/* Sessions Table */}
                <div className="glass-dark rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-dark-800 text-gray-400 text-sm uppercase">
                                <th className="px-6 py-4">Session ID</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Connected At</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {sessions.map((session) => (
                                <tr key={session.id} className="hover:bg-white/5 transition">
                                    <td className="px-6 py-4 font-mono text-sm">{session.id}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${session.status === 'CONNECTED'
                                                ? 'bg-green-500/20 text-green-500'
                                                : 'bg-yellow-500/20 text-yellow-500'
                                            }`}>
                                            {session.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            {new Date(session.connectedAt).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => stopSession(session.id)}
                                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 rounded-lg hover:text-white transition"
                                            >
                                                <Power className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 bg-dark-700 text-gray-400 hover:text-white rounded-lg transition">
                                                <Activity className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {sessions.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No active sessions found. The factory is silent.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
