import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
    Table, ShoppingCart, Receipt,
    CreditCard, Users, Package, ChefHat,
    Globe, Utensils, Settings, Plus
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const Sidebar = () => {
    const { theme } = useTheme()
    const [currentTime, setCurrentTime] = useState(new Date())
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null')
    const isManager = currentUser?.role === 'Manager'
    const canAccessPos = isManager || Boolean(
        currentUser?.canAccessPos ||
        currentUser?.canManageMenu ||
        currentUser?.canManageInventory ||
        currentUser?.canAccessKitchenStatus ||
        currentUser?.canAccessThirdPartyOrders
    )
    const canManageMenu = isManager || Boolean(currentUser?.canManageMenu)
    const canManageInventory = isManager || Boolean(currentUser?.canManageInventory)
    const canAccessKitchenStatus = isManager || Boolean(currentUser?.canAccessKitchenStatus)
    const canAccessThirdPartyOrders = isManager || Boolean(currentUser?.canAccessThirdPartyOrders)

    const menuItems = [
        { to: '/tables', label: 'Table Layout', icon: Table },
        { to: '/orders', label: 'Order Entry', icon: ShoppingCart },
        { to: '/summary', label: 'Order Summary', icon: Receipt },
        { to: '/payment', label: 'Payment', icon: CreditCard },
        { to: '/manage-items', label: 'Add Items to Order', icon: Plus },
        { to: '/manager', label: 'Manager', icon: Users, managerOnly: true },
        { to: '/inventory', label: 'Inventory', icon: Package, access: canManageInventory },
        { to: '/status', label: 'Kitchen Status', icon: ChefHat, access: canAccessKitchenStatus },
        { to: '/third-party', label: 'Third-Party', icon: Globe, access: canAccessThirdPartyOrders },
        { to: '/menu-manager', label: 'Menu Manager', icon: Utensils, access: canManageMenu },
        { to: '/settings', label: 'Settings', icon: Settings, managerOnly: true },
    ]

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className={`fixed left-0 top-0 h-screen w-64 border-r shadow-2xl z-50 transition-colors ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            {/* Logo & Title */}
            <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-brand p-3 rounded-2xl">
                        <ChefHat className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl! font-black tracking-tight text-gray-900">RestroSync</h1>
                        <p className="text-sm text-gray-500">Point of Sale</p>
                    </div>
                </div>
            </div>

            {/* Current Time & Date */}
            <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="text-center">
                    <div className="text-3xl font-bold text-brand">
                        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-2">
                    {canAccessPos && menuItems.filter((item) => {
                        if (item.managerOnly) return isManager
                        if (item.access === false) return false
                        return true
                    }).map((item) => {
                        return (
                            <li key={item.to}>
                                <NavLink to={item.to}>
                                    {({ isActive }) => (
                                        <div
                                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${isActive
                                                ? 'bg-brand text-white shadow-2xl shadow-brand/50'
                                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                }`}
                                        >
                                            <span>{item.label}</span>
                                            {isActive && (
                                                <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                            )}
                                        </div>
                                    )}
                                </NavLink>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* Bottom Section */}
            <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="text-center">
                    <p className="text-xs text-gray-500 font-medium">
                        Powered by RestroSync
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Sidebar