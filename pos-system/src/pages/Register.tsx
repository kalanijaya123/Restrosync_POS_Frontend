import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import api from '../services/api'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const Register = () => {
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
    const [errors, setErrors] = useState<{ [k: string]: string }>({})
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const navigate = useNavigate()
    const { theme } = useTheme()

    const validate = () => {
        const e: any = {}
        if (!form.username || form.username.trim().length < 3) e.username = 'Username must be at least 3 characters.'
        if (!EMAIL_RE.test(form.email)) e.email = 'Please enter a valid email address.'
        if (form.password.length < 6) e.password = 'Password must be at least 6 characters.'
        if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return
        setSubmitting(true)

        try {
            // Try backend registration first
            const response = await api.post('/auth/register', {
                username: form.username.trim(),
                email: form.email.trim(),
                password: form.password,
                role: 'Staff'
            })

            if (response.data) {
                // Also save to localStorage for fallback
                const users = JSON.parse(localStorage.getItem('posUsers') || '[]')
                users.push({
                    username: form.username.trim(),
                    email: form.email.trim(),
                    password: form.password,
                    role: 'Staff'
                })
                localStorage.setItem('posUsers', JSON.stringify(users))

                setSubmitting(false)
                alert('Account created successfully!')
                navigate('/')
            }
        } catch (err: any) {
            // Fallback to localStorage for demo purposes
            if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
                try {
                    const users = JSON.parse(localStorage.getItem('posUsers') || '[]')
                    if (users.find((u: any) => u.email === form.email)) {
                        setErrors({ email: 'Email already used.' })
                        setSubmitting(false)
                        return
                    }

                    users.push({
                        username: form.username.trim(),
                        email: form.email.trim(),
                        password: form.password,
                        role: 'Staff'
                    })
                    localStorage.setItem('posUsers', JSON.stringify(users))

                    setSubmitting(false)
                    alert('Account created successfully!')
                    navigate('/')
                } catch {
                    setErrors({ general: 'Something went wrong. Try again.' })
                    setSubmitting(false)
                }
            } else {
                setErrors({ general: err.response?.data?.message || 'Registration failed. Try again.' })
                setSubmitting(false)
            }
        }
    }

    return (
        <div className={`min-h-screen bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-300/30 dark:to-blue-200/30 flex items-center justify-center p-6`}>
            <div className={`${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-gray-800'} rounded-2xl shadow-2xl w-full max-w-lg p-10`}>
                {/* CLEAN TITLE */}
                <h1 className={`text-4xl font-bold text-center ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-1`}>Create Account</h1>
                <p className={`text-sm text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-8`}>Join RestroSync POS System</p>

                {errors.general && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm">
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* USERNAME */}
                    <div>
                        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Username</label>
                        <input
                            type="text"
                            placeholder="e.g. john123"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.username ? 'border-red-400' : theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                        {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
                    </div>

                    {/* EMAIL */}
                    <div>
                        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Email Address</label>
                        <input
                            type="email"
                            placeholder="john@restrosync.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-400' : theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                    </div>

                    {/* PASSWORD */}
                    <div>
                        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-400' : theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
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
                        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                    </div>

                    {/* CONFIRM PASSWORD */}
                    <div>
                        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={form.confirmPassword}
                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-400' : theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                                className={`absolute inset-y-0 right-3 flex items-center ${theme === 'dark' ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'}`}
                            >
                                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                    </div>

                    {/* SUBMIT BUTTON */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-70 text-white font-bold py-4 rounded-lg text-lg transition shadow-lg"
                        style={{ background: submitting ? undefined : 'linear-gradient(to right, #4169E1, #0047AB)' }}
                    >
                        {submitting ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <p className={`text-center mt-8 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Already have an account?{' '}
                    <Link to="/" className="text-blue-600 font-bold hover:underline" style={{ color: '#4169E1' }}>
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Register