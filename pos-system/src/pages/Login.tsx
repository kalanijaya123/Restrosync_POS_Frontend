import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Login: React.FC = () => {
    const [pin, setPin] = useState('')
    const navigate = useNavigate()

    const handleLogin = () => {
        if (pin === '1234') navigate('/dashboard')
        else alert('Wrong PIN!')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center">
            <div className="bg-white p-16 rounded-2xl shadow-2xl w-full max-w-2xl">
                <h1 className="text-6xl font-bold text-center text-indigo-700 mb-12">RestroSync POS</h1>
                <input
                    type="password"
                    placeholder="Enter PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-8 py-6 text-4xl text-center border-4 border-gray-300 rounded-2xl focus:border-indigo-600 mb-10"
                />
                <button
                    onClick={handleLogin}
                    className="w-full bg-indigo-700 hover:bg-indigo-800 text-white text-3xl font-bold py-8 rounded-2xl shadow-lg"
                >
                    LOGIN
                </button>
                <p className="text-center mt-8 text-gray-600 text-xl">Demo PIN: <strong>1234</strong></p>
            </div>
        </div>
    )
}

export default Login