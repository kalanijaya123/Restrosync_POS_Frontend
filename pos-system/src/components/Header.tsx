import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'

const Header = () => {
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null')
    const userName = user?.name || 'Staff'
    const role = user?.role || 'Waiter'

    // Live Time & Date
    const [time, setTime] = useState('')
    const [date, setDate] = useState('')

    useEffect(() => {
        const updateClock = () => {
            const now = new Date()
            setTime(now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }))
            setDate(now.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }))
        }

        updateClock()
        const interval = setInterval(updateClock, 1000)
        return () => clearInterval(interval)
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('currentUser')
        navigate('/')
    }

    return (
        <div className="fixed top-0 left-64 right-0 h-20 bg-black/60 backdrop-blur-xl border-b border-brand z-50 flex items-center justify-between px-8 shadow-2xl">

            {/* LEFT: Welcome + Role */}
            <div className="flex items-center gap-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">
                        Welcome back,{' '}
                        <span className="text-cyan-300">
                            {userName}
                        </span>
                    </h2>
                    <p className="text-sm text-purple-300 font-medium tracking-wider">
                        {role} • Active Session
                    </p>
                </div>
            </div>

            {/* CENTER: Live Clock & Date */}
            <div className="text-center">
                <div className="text-3xl font-bold text-cyan-300 tracking-wider">
                    {time}
                </div>
                <div className="text-sm text-purple-300 font-medium mt-1">
                    {date}
                </div>
            </div>

            {/* RIGHT: Profile + Logout */}
            <div className="flex items-center gap-6">
                {/* Profile Avatar */}
                <div className="relative group">
                    <div className="w-14 h-14 bg-brand rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-2xl ring-4 ring-brand">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-brand-opaque opacity-0 group-hover:opacity-50 blur-xl transition"></div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xl transition-all transform hover:scale-105 active:scale-95"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="hidden md:block">Logout</span>
                </button>
            </div>
        </div>
    )
}

export default Header