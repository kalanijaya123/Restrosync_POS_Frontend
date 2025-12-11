import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Bell, Moon, Sun, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useNotifications } from '../contexts/NotificationContext'
import { motion, AnimatePresence } from 'framer-motion'

const Header = () => {
    const navigate = useNavigate()
    const { theme, toggleTheme } = useTheme()
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications()
    const [showNotifications, setShowNotifications] = useState(false)

    const user = JSON.parse(localStorage.getItem('currentUser') || 'null')
    const userName = user?.name || 'Staff'
    const role = user?.role || 'Waiter'

    const handleLogout = () => {
        localStorage.removeItem('currentUser')
        navigate('/')
    }

    const formatTime = (date: Date) => {
        const now = new Date()
        const diff = now.getTime() - new Date(date).getTime()
        const minutes = Math.floor(diff / 60000)

        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m ago`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}h ago`
        return new Date(date).toLocaleDateString()
    }

    return (
        <div className="fixed top-0 left-64 right-0 h-20 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 z-50 flex items-center justify-between px-8 shadow-lg transition-colors">

            {/* LEFT: Welcome + Role */}
            <div className="flex items-center gap-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Welcome back,{' '}
                        <span className="text-brand">
                            {userName}
                        </span>
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {role} • Active Session
                    </p>
                </div>
            </div>

            {/* RIGHT: Dark Mode + Notifications + Profile + Logout */}
            <div className="flex items-center gap-4">

                {/* Dark Mode Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? (
                        <Sun className="w-5 h-5 text-yellow-500" />
                    ) : (
                        <Moon className="w-5 h-5 text-gray-700" />
                    )}
                </button>

                {/* Notification Bell */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-3 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden"
                            >
                                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                                    <div className="flex gap-2">
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-xs text-brand hover:underline"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={clearAll}
                                                className="text-xs text-red-500 hover:underline"
                                            >
                                                Clear all
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                            <p>No notifications</p>
                                        </div>
                                    ) : (
                                        notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                onClick={() => markAsRead(notif.id)}
                                                className={`p-4 border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition ${!notif.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-xs font-semibold uppercase ${notif.type === 'order' ? 'text-green-600' :
                                                            notif.type === 'kitchen' ? 'text-orange-600' :
                                                                notif.type === 'payment' ? 'text-blue-600' :
                                                                    'text-gray-600'
                                                        }`}>
                                                        {notif.type}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatTime(notif.timestamp)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-900 dark:text-white">
                                                    {notif.message}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Profile Avatar */}
                <div className="relative group">
                    <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg ring-2 ring-blue-200 dark:ring-blue-800">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md transition-all transform hover:scale-105 active:scale-95"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:block">Logout</span>
                </button>
            </div>

            {/* Backdrop for closing dropdown */}
            {showNotifications && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setShowNotifications(false)}
                />
            )}
        </div>
    )
}

export default Header