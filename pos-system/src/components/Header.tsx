import React from 'react'
import { useNavigate } from 'react-router-dom'

const Header = () => {
    const navigate = useNavigate()

    // Get user from localStorage (set on login)
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null')
    const userName = user?.name || 'Staff'

    const handleLogout = () => {
        localStorage.removeItem('currentUser')
        navigate('/')
    }

    return (
        <div className="fixed top-0 left-64 right-0 h-20 bg-white shadow-lg z-50 flex items-center justify-between px-10 border-b-4 border-indigo-600">
            {/* Welcome Message */}
            <div className="flex items-center gap-6">
                <div className="text-3xl font-bold text-gray-800">
                    Welcome, <span className="text-indigo-600">{userName}</span>
                </div>
            </div>

            {/* Profile + Logout */}
            <div className="flex items-center gap-6">
                {/* Profile Circle */}
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                    {userName.charAt(0).toUpperCase()}
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center gap-3"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </button>
            </div>
        </div>
    )
}

export default Header