import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "tailwindcss";
const Login: React.FC = () => {
    const [pin, setPin] = useState('');
    const navigate = useNavigate();

    const handleLogin = () => {
        if (pin === '1234') {
            navigate('/dashboard');
        } else {
            alert('Wrong PIN! Try 1234');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-12 w-full max-w-md">
                <h1 className="text-5xl font-bold text-center text-blue-600 mb-8">RestroSync</h1>
                <p className="text-center text-gray-600 mb-10 text-xl">POS System</p>

                <input
                    type="password"
                    placeholder="Enter PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-6 py-5 border-2 border-gray-300 rounded-2xl text-3xl text-center focus:border-blue-500 focus:outline-none transition mb-8"
                />

                <button
                    onClick={handleLogin}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-6 rounded-2xl text-2xl shadow-lg transition transform hover:scale-105"
                >
                    LOGIN
                </button>

                <p className="text-center mt-6 text-gray-500">Demo PIN: <span className="font-bold">1234</span></p>
            </div>
        </div>
    );
};

export default Login;