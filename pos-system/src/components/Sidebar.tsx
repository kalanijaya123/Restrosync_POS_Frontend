import React from 'react'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
    return (
        <div className="w-64 bg-gray-900 text-white min-h-screen p-6 fixed left-0 top-0 flex flex-col">
            {/* Smaller, elegant RestroSync title */}
            <h1 className="text-base font-bold mb-12 text-left tracking-wider">
                Restro
                Sync
            </h1>

            <nav className="space-y-2 flex-1">
                <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                        `block py-3 px-6 rounded-lg transition text-lg font-medium ${isActive ? 'bg-gray-700 shadow-lg' : 'hover:bg-gray-700'
                        }`
                    }
                >
                    Dashboard
                </NavLink>
                <NavLink
                    to="/tables"
                    className={({ isActive }) =>
                        `block py-3 px-6 rounded-lg transition text-lg font-medium ${isActive ? 'bg-gray-700 shadow-lg' : 'hover:bg-gray-700'
                        }`
                    }
                >
                    Table Layout
                </NavLink>
                <NavLink
                    to="/orders"
                    className={({ isActive }) =>
                        `block py-3 px-6 rounded-lg transition text-lg font-medium ${isActive ? 'bg-gray-700 shadow-lg' : 'hover:bg-gray-700'
                        }`
                    }
                >
                    Order Entry
                </NavLink>
                <NavLink
                    to="/payment"
                    className={({ isActive }) =>
                        `block py-3 px-6 rounded-lg transition text-lg font-medium ${isActive ? 'bg-gray-700 shadow-lg' : 'hover:bg-gray-700'
                        }`
                    }
                >
                    Payment
                </NavLink>
                <NavLink
                    to="/history"
                    className={({ isActive }) =>
                        `block py-3 px-6 rounded-lg transition text-lg font-medium ${isActive ? 'bg-gray-700 shadow-lg' : 'hover:bg-gray-700'
                        }`
                    }
                >
                    Order History
                </NavLink>
                <NavLink
                    to="/manager"
                    className={({ isActive }) =>
                        `block py-3 px-6 rounded-lg transition text-lg font-medium ${isActive ? 'bg-gray-700 shadow-lg' : 'hover:bg-gray-700'
                        }`
                    }
                >
                    Manager
                </NavLink>
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `block py-3 px-6 rounded-lg transition text-lg font-medium ${isActive ? 'bg-gray-700 shadow-lg' : 'hover:bg-gray-700'
                        }`
                    }
                >
                    Settings
                </NavLink>
            </nav>

            {/* Optional: Logout at bottom */}
            <div className="mt-auto pt-8 border-t border-gray-700">
                <button className="w-full py-3 px-6 text-left text-red-400 hover:bg-gray-800 rounded-lg transition text-lg font-medium">
                    Logout
                </button>
            </div>
        </div>
    )
}

export default Sidebar