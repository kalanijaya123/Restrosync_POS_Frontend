import React from 'react'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
    return (
        <div className="w-64 bg-gray-900 text-white min-h-screen p-6 fixed left-0 top-0">
            <h1 className="text-3xl font-bold mb-12 text-center">RestroSync</h1>
            <nav className="space-y-4">
                <NavLink to="/dashboard" className="block py-3 px-6 rounded-lg hover:bg-gray-700 transition text-lg">Dashboard</NavLink>
                <NavLink to="/tables" className="block py-3 px-6 rounded-lg hover:bg-gray-700 transition text-lg">Table Layout</NavLink>
                <NavLink to="/orders" className="block py-3 px-6 rounded-lg hover:bg-gray-700 transition text-lg">Order Entry</NavLink>
                <NavLink to="/payment" className="block py-3 px-6 rounded-lg hover:bg-gray-700 transition text-lg">Payment</NavLink>
                <NavLink to="/history" className="block py-3 px-6 rounded-lg hover:bg-gray-700 transition text-lg">Order History</NavLink>
                <NavLink to="/manager" className="block py-3 px-6 rounded-lg hover:bg-gray-700 transition text-lg">Manager</NavLink>
                <NavLink to="/settings" className="block py-3 px-6 rounded-lg hover:bg-gray-700 transition text-lg">Settings</NavLink>
            </nav>
        </div>
    )
}

export default Sidebar