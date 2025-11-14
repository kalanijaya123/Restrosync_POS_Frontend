import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

const Login = () => {
    const [form, setForm] = useState({ username: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // Get users from localStorage (created in Register)
            const users = JSON.parse(localStorage.getItem('posUsers') || '[]')
            const user = users.find((u: any) =>
                u.username === form.username && u.password === form.password
            )

            if (user) {
                // Save logged-in user
                localStorage.setItem('currentUser', JSON.stringify({
                    name: user.username,
                    email: user.email,
                    role: user.role
                }))
                navigate('/dashboard')
            } else {
                setError('Invalid username or password')
            }
        } catch (err) {
            setError('Login failed. Try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-10">
                {/* TITLE */}
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-1">Welcome Back</h1>
                <p className="text-sm text-center text-gray-500 mb-8">Sign in to RestroSync POS</p>

                {/* ERROR MESSAGE */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    {/* USERNAME */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                            type="text"
                            placeholder="Enter your username"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* PASSWORD WITH EYE ICON */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-indigo-600"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* LOGIN BUTTON */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 text-white font-bold py-4 rounded-lg text-lg transition shadow-lg"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                {/* REGISTER LINK */}
                <p className="text-center mt-8 text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-indigo-600 font-bold hover:underline">
                        Create one
                    </Link>
                </p>

                {/* DEMO CREDENTIALS (for presentation) */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600 text-center">
                    <p className="font-bold text-gray-700">Demo Account:</p>
                    <p>Username: <strong>admin</strong> | Password: <strong>123456</strong></p>
                    <p className="mt-2 text-xs text-gray-500">Register first → then use credentials</p>
                </div>
            </div>
        </div>
    )
}

export default Login