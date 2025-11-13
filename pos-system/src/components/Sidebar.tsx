import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const Sidebar = () => {
    const navigate = useNavigate()

    const handleLogout = () => {
        // Optional: clear auth token
        navigate('/')
    }

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
            {/* SMALL & ELEGANT LOGO */}
            <div className="p-8 border-b border-gray-800">
                <h1 className="text-xl font-bold text-center tracking-widest text-gray-300">
                    Restro
                    Sync
                </h1>
            </div>

            {/* MENU ITEMS */}
            <nav className="flex-1 px-6 py-8 space-y-2">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `block w-full text-left py-4 px-6 rounded-xl transition-all duration-200 text-base font-medium tracking-wide ${isActive
                                ? 'bg-indigo-600 text-white shadow-lg transform scale-105'
                                : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                            }`
                        }
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* LOGOUT AT BOTTOM */}
            <div className="p-6 border-t border-gray-800">
                <button
                    onClick={handleLogout}
                    className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 rounded-xl text-base font-medium transition-all duration-200 shadow-lg"
                >
                    Logout
                </button>
            </div>
        </div>
    )
}

export default Sidebar