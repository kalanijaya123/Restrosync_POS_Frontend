import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import api from '../services/api'

const Login = () => {
    const [form, setForm] = useState({ username: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { theme } = useTheme()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // Try backend authentication first
            const response = await api.post('/auth/login', {
                username: form.username,
                password: form.password
            })

            console.log('Backend response:', response.data)

            // Handle different backend response structures
            if (response.data) {
                // Save token if provided
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token)
                }

                // Save user data
                localStorage.setItem('currentUser', JSON.stringify({
                    name: response.data.username || response.data.name || form.username,
                    email: response.data.email || '',
                    role: response.data.role || 'Staff'
                }))
                navigate('/dashboard')
            } else {
                setError('Invalid credentials')
            }
        } catch (err: any) {
            console.error('Login error:', err.response?.data || err.message)

            // Fallback to localStorage for demo purposes
            if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
                try {
                    const users = JSON.parse(localStorage.getItem('posUsers') || '[]')
                    const user = users.find((u: any) =>
                        u.username === form.username && u.password === form.password
                    )

                    if (user) {
                        localStorage.setItem('currentUser', JSON.stringify({
                            name: user.username,
                            email: user.email,
                            role: user.role
                        }))
                        navigate('/dashboard')
                    } else {
                        setError('Invalid username or password')
                    }
                } catch {
                    setError('Login failed. Try again.')
                }
            } else {
                // Show backend error details
                const backendMessage = err.response?.data?.message || err.response?.data?.error || err.response?.data
                setError(typeof backendMessage === 'string' ? backendMessage : 'Invalid username or password')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={`min-h-screen bg-gradient-to-br ${theme === 'dark' ? 'from-blue-900 to-slate-900' : 'from-blue-500 to-blue-700'} flex items-center justify-center p-6`}>
            <div className={`${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-gray-800'} rounded-2xl shadow-2xl w-full max-w-lg p-10`}>
                {/* TITLE */}
                <h1 className={`text-4xl font-bold text-center ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-1`}>Welcome Back</h1>
                <p className={`text-sm text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-8`}>Sign in to RestroSync POS</p>

                {/* ERROR MESSAGE */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    {/* USERNAME */}
                    <div>
                        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Username</label>
                        <input
                            type="text"
                            placeholder="Enter your username"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            required
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                    </div>

                    {/* PASSWORD WITH EYE ICON */}
                    <div>
                        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                className={`absolute inset-y-0 right-3 flex items-center ${theme === 'dark' ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'}`}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* LOGIN BUTTON */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-70 text-white font-bold py-4 rounded-lg text-lg transition shadow-lg"
                        style={{ background: loading ? undefined : 'linear-gradient(to right, #4169E1, #0047AB)' }}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                {/* REGISTER LINK */}
                <p className={`text-center mt-8 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-600 font-bold hover:underline" style={{ color: '#4169E1' }}>
                        Create one
                    </Link>
                </p>

                {/* DEMO CREDENTIALS (for presentation) */}
                <div className={`mt-6 p-4 rounded-lg text-xs text-center ${theme === 'dark' ? 'bg-slate-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                    <p className={`font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Demo Account:</p>
                    <p>Username: <strong>admin</strong> | Password: <strong>123456</strong></p>
                    <p className={`mt-2 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Register first → then use credentials</p>
                </div>
            </div>
        </div>
    )
}

export default Login