import React from 'react'
import { NavLink } from 'react-router-dom'
import {
    Table, ShoppingCart, Receipt,
    CreditCard, Users, Package, ChefHat,
    Globe, Utensils, Settings
} from 'lucide-react'

const Sidebar = () => {
    const menuItems = [
        { to: '/tables', label: 'Table Layout', icon: Table },
        { to: '/orders', label: 'Order Entry', icon: ShoppingCart },
        { to: '/summary', label: 'Order Summary', icon: Receipt },
        { to: '/payment', label: 'Payment', icon: CreditCard },
        { to: '/manager', label: 'Manager', icon: Users },
        { to: '/inventory', label: 'Inventory', icon: Package },
        { to: '/status', label: 'Kitchen Status', icon: ChefHat },
        { to: '/third-party', label: 'Third-Party', icon: Globe },
        { to: '/menu-manager', label: 'Menu Manager', icon: Utensils },
        { to: '/settings', label: 'Settings', icon: Settings },
    ]

    // Live Date & Time
    const now = new Date()
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

    return (
        <div className="w-64 bg-black text-white min-h-screen fixed left-0 top-0 flex flex-col shadow-2xl border-r border-brand">

            {/* LOGO + DATE/TIME */}
            <div className="p-6 border-b border-purple-800/50 text-center">
                <h1 className="text-3xl font-extrabold tracking-tight">
                    <span className="text-white">
                        Restro
                    </span>
                    <span className="block text-xl font-light text-purple-200 tracking-widest">
                        Sync POS
                    </span>
                </h1>

                {/* LIVE DATE & TIME */}
                <div className="mt-5 text-brand">
                    <div className="text-2xl font-bold">{time}</div>
                    <div className="text-sm tracking-wider opacity-80">{date}</div>
                </div>
            </div>

            {/* MENU ITEMS – ALL VISIBLE, NO SCROLL */}
            <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-hidden">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                        >
                            {({ isActive }) => {
                                const baseClasses = 'flex items-center gap-4 w-full py-3.5 px-5 rounded-xl transition-all duration-300 text-base font-medium group';
                                const activeClasses = 'bg-brand text-white shadow-xl translate-x-1';
                                const inactiveClasses = 'text-gray-300 hover:bg-white/10 hover:text-white hover:shadow-md hover:translate-x-1';
                                return (
                                    <div className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-brand'}`} />
                                        <span>{item.label}</span>
                                        {isActive && <div className="ml-auto w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>}
                                    </div>
                                )
                            }}
                        </NavLink>
                    )
                })}
            </nav>

            {/* BOTTOM TAGLINE */}
            <div className="p-5 border-t border-brand text-center">
                <p className="text-xs text-brand font-medium tracking-wider">
                    Powered by RestroSync
                </p>
            </div>
        </div>
    )
}

export default Sidebar