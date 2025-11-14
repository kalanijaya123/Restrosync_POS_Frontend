import React from 'react'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
    const menuItems = [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/tables', label: 'Table Layout' },
        { to: '/orders', label: 'Order Entry' },
        { to: '/summary', label: 'Order Summary' },
        { to: '/payment', label: 'Payment' },
        { to: '/history', label: 'Order History' },
        { to: '/manager', label: 'Manager' },
        { to: '/inventory', label: 'Inventory' },
        { to: '/status', label: 'Kitchen Status' },
        { to: '/third-party', label: 'Third-Party' },
        { to: '/settings', label: 'Settings' },
    ]

    return (
        <div className="w-64 bg-gray-900 text-white min-h-screen fixed left-0 top-0 flex flex-col shadow-2xl">
            {/* ELEGANT TWO-LINE LOGO */}
            <div className="p-8 border-b border-gray-800 text-center">
                <h1 className="text-2xl font-bold tracking-widest text-indigo-400 leading-tight">
                    Restro
                    <span className="block text-xl text-gray-300">Sync</span>
                </h1>
            </div>

            {/* MENU ITEMS */}
            {/* Remove flex-1 so the logout button appears right after the last menu item
                and reduce vertical padding for tighter spacing. */}
            <nav className="px-6 py-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `block w-full text-left py-4 px-6 rounded-xl transition-all duration-300 text-base font-medium tracking-wide transform ${isActive
                                ? 'bg-indigo-600 text-white shadow-xl scale-105 translate-x-2'
                                : 'hover:bg-gray-800 text-gray-300 hover:text-white hover:translate-x-1'
                            }`
                        }
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Logout removed per request */}
        </div>
    )
}

export default Sidebar