import { useEffect, useState } from 'react'
import { getApiUrl } from '../services/api'

type Order = {
    id: string
    total?: number
    createdAt?: string | number[]
}

type DailySales = {
    dateKey: string
    label: string
    orders: number
    sales: number
}

type StaffUser = {
    id: string
    username: string
    email?: string
    role?: string
    canAccessPos?: boolean
    canAccessKds?: boolean
    canAccessOnlineOrder?: boolean
    canManageDiscounts?: boolean
    canManageMenu?: boolean
    canManageInventory?: boolean
    canAccessKitchenStatus?: boolean
    canAccessThirdPartyOrders?: boolean
}

const ManagerDashboard = () => {
    const [stats, setStats] = useState({ sales: 0, orders: 0, avg: 0 })
    const [history, setHistory] = useState<DailySales[]>([])
    const [staffUsers, setStaffUsers] = useState<StaffUser[]>([])
    const [savingUserId, setSavingUserId] = useState('')
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState('')
    const [sortMode, setSortMode] = useState<'newest' | 'oldest'>('newest')
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null')
    const isManager = currentUser?.role === 'Manager'

    const parseCreatedAt = (value: string | number[] | undefined): Date | null => {
        if (!value) return null

        if (Array.isArray(value)) {
            if (value.length < 3) return null

            return new Date(
                value[0],
                (value[1] || 1) - 1,
                value[2] || 1,
                value[3] || 0,
                value[4] || 0,
                value[5] || 0
            )
        }

        const parsed = new Date(value)
        return Number.isNaN(parsed.getTime()) ? null : parsed
    }

    const toDateKey = (date: Date) => {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
    }

    const formatRs = (amount: number) => {
        return `Rs ${new Intl.NumberFormat('en-LK', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount)}`
    }

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch(getApiUrl('/orders'))
                if (!res.ok) throw new Error('Failed to load orders')

                const data = await res.json()
                const orders: Order[] = Array.isArray(data) ? data : []

                const now = new Date()
                const todayKey = toDateKey(now)
                const grouped = new Map<string, DailySales>()

                orders.forEach((order) => {
                    const createdAt = parseCreatedAt(order.createdAt)
                    if (!createdAt) return

                    const dateKey = toDateKey(createdAt)
                    const total = Number(order.total || 0)
                    const existing = grouped.get(dateKey)

                    if (existing) {
                        existing.orders += 1
                        existing.sales += total
                    } else {
                        grouped.set(dateKey, {
                            dateKey,
                            label: createdAt.toLocaleDateString(),
                            orders: 1,
                            sales: total
                        })
                    }
                })

                const historyRows = Array.from(grouped.values()).sort((a, b) =>
                    b.dateKey.localeCompare(a.dateKey)
                )

                const today = grouped.get(todayKey)
                const todayOrders = today?.orders || 0
                const todaySales = today?.sales || 0

                setStats({
                    sales: todaySales,
                    orders: todayOrders,
                    avg: todayOrders > 0 ? todaySales / todayOrders : 0
                })
                setHistory(historyRows)
            } catch {
                setStats({ sales: 0, orders: 0, avg: 0 })
                setHistory([])
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    useEffect(() => {
        const fetchStaffUsers = async () => {
            if (!isManager || !currentUser?.id) return

            try {
                const response = await fetch(getApiUrl('/users/staff'), {
                    headers: { userId: currentUser.id }
                })

                if (!response.ok) throw new Error('Failed to load staff users')

                const data = await response.json()
                setStaffUsers(Array.isArray(data) ? data : [])
            } catch {
                setStaffUsers([])
            }
        }

        fetchStaffUsers()
    }, [currentUser?.id, isManager])

    const updatePermission = async (userId: string, field: keyof StaffUser, value: boolean) => {
        if (!currentUser?.id) return

        setSavingUserId(userId)
        try {
            const target = staffUsers.find((user) => user.id === userId)
            const response = await fetch(getApiUrl(`/users/${userId}/permissions`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    userId: currentUser.id
                },
                body: JSON.stringify({
                    canAccessPos: field === 'canAccessPos' ? value : target?.canAccessPos,
                    canAccessKds: field === 'canAccessKds' ? value : target?.canAccessKds,
                    canAccessOnlineOrder: field === 'canAccessOnlineOrder' ? value : target?.canAccessOnlineOrder,
                    canManageDiscounts: field === 'canManageDiscounts' ? value : target?.canManageDiscounts,
                    canManageMenu: field === 'canManageMenu' ? value : target?.canManageMenu,
                    canManageInventory: field === 'canManageInventory' ? value : target?.canManageInventory,
                    canAccessKitchenStatus: field === 'canAccessKitchenStatus' ? value : target?.canAccessKitchenStatus,
                    canAccessThirdPartyOrders: field === 'canAccessThirdPartyOrders' ? value : target?.canAccessThirdPartyOrders
                })
            })

            if (!response.ok) throw new Error('Failed to update permissions')

            const updated = await response.json()
            setStaffUsers((prev) => prev.map((user) => (user.id === userId ? updated : user)))
        } catch {
            // leave the UI as-is if the update fails
        } finally {
            setSavingUserId('')
        }
    }

    const filteredHistory = history
        .filter((day) => !selectedDate || day.dateKey === selectedDate)
        .sort((a, b) => (sortMode === 'newest' ? b.dateKey.localeCompare(a.dateKey) : a.dateKey.localeCompare(b.dateKey)))

    return (
        <div>
            <h1 className="text-5xl font-bold mb-8 text-gray-900 dark:text-white">Manager Dashboard</h1>

            {!isManager && (
                <div className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 px-6 py-5 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                    Only managers can view staff permissions.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800/80">
                    <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">Total Sales</p>
                    <p className="text-5xl font-bold mt-4 text-brand">{formatRs(stats.sales)}</p>
                </div>
                <div className="p-6 rounded-2xl shadow-lg border border-emerald-200 dark:border-emerald-700 text-slate-800 dark:text-white bg-emerald-50 dark:bg-emerald-900/20">
                    <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">Orders Today</p>
                    <p className="text-5xl font-bold mt-4 text-emerald-600 dark:text-emerald-300">{stats.orders}</p>
                </div>
                <div className="p-6 rounded-2xl shadow-lg border border-amber-200 dark:border-amber-700 text-slate-800 dark:text-white bg-amber-50 dark:bg-amber-900/20">
                    <p className="text-lg font-semibold text-amber-700 dark:text-amber-300">Avg Order</p>
                    <p className="text-5xl font-bold mt-4 text-amber-600 dark:text-amber-300">{formatRs(stats.avg)}</p>
                </div>
            </div>

            <div className="mt-10 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Daily Sales History</h2>
                    <p className="text-gray-500 dark:text-slate-300 mt-1">Sales and order count by day</p>
                    <div className="mt-4 flex flex-wrap gap-3 items-center">
                        <select
                            value={sortMode}
                            onChange={(e) => setSortMode(e.target.value as 'newest' | 'oldest')}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                        >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                        </select>

                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                        />

                        {selectedDate && (
                            <button
                                onClick={() => setSelectedDate('')}
                                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white"
                            >
                                Clear Date
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <p className="p-8 text-xl text-gray-600 dark:text-slate-300">Loading history...</p>
                ) : filteredHistory.length === 0 ? (
                    <p className="p-8 text-xl text-gray-600 dark:text-slate-300">No order history available.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-lg">
                            <thead className="bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Orders</th>
                                    <th className="px-6 py-4">Sales</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredHistory.map((day) => (
                                    <tr key={day.dateKey} className="border-b border-gray-200 dark:border-slate-700">
                                        <td className="px-6 py-4 text-gray-800 dark:text-slate-100">{day.label}</td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-slate-200">{day.orders}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{formatRs(day.sales)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isManager && (
                <div className="mt-10 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Staff Permissions</h2>
                        <p className="text-gray-500 dark:text-slate-300 mt-1">
                            Grant or revoke access for POS, KDS, online orders, discounts, menu management, inventory, kitchen status, and third-party orders.
                        </p>
                    </div>

                    <div className="p-6 space-y-4">
                        {staffUsers.length === 0 ? (
                            <p className="text-gray-600 dark:text-slate-300">No staff accounts found.</p>
                        ) : (
                            staffUsers.map((user) => (
                                <div key={user.id} className="rounded-2xl border border-gray-200 dark:border-slate-700 p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{user.username}</h3>
                                        <p className="text-sm text-gray-500 dark:text-slate-300">{user.email} • {user.role}</p>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        {[
                                            ['canAccessPos', 'POS'],
                                            ['canAccessKds', 'KDS'],
                                            ['canAccessOnlineOrder', 'Online'],
                                            ['canManageDiscounts', 'Discounts'],
                                            ['canManageMenu', 'Menu'],
                                            ['canManageInventory', 'Inventory'],
                                            ['canAccessKitchenStatus', 'Kitchen Status'],
                                            ['canAccessThirdPartyOrders', 'Third Party']
                                        ].map(([field, label]) => (
                                            <label key={field} className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-600 px-3 py-2 text-gray-700 dark:text-gray-200">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(user[field as keyof StaffUser])}
                                                    disabled={savingUserId === user.id}
                                                    onChange={(e) => updatePermission(user.id, field as keyof StaffUser, e.target.checked)}
                                                />
                                                {label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ManagerDashboard