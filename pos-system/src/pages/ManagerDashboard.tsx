import { useState, useEffect } from 'react'
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

const ManagerDashboard = () => {
    const [stats, setStats] = useState({ sales: 0, orders: 0, avg: 0 })
    const [history, setHistory] = useState<DailySales[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState('all')
    const [selectedDay, setSelectedDay] = useState('all')

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

    const availableMonths = Array.from(new Set(history.map((day) => day.dateKey.slice(0, 7))))

    const availableDays = history
        .filter((day) => selectedMonth === 'all' || day.dateKey.startsWith(`${selectedMonth}-`))
        .map((day) => day.dateKey)

    const filteredHistory = history.filter((day) => {
        const monthMatches = selectedMonth === 'all' || day.dateKey.startsWith(`${selectedMonth}-`)
        const dayMatches = selectedDay === 'all' || day.dateKey === selectedDay
        return monthMatches && dayMatches
    })

    return (
        <div>
            <h1 className="text-5xl font-bold mb-10 text-brand">Manager Dashboard</h1>
            <div className="grid grid-cols-3 gap-10">
                <div className="p-12 rounded-3xl shadow-2xl text-gray-800 dark:text-gray-900 bg-blue-200">
                    <p className="text-3xl font-semibold">Total Sales</p>
                    <p className="text-7xl font-bold mt-6">{formatRs(stats.sales)}</p>
                </div>
                <div className="p-12 rounded-3xl shadow-2xl text-gray-800 dark:text-gray-900 bg-green-200">
                    <p className="text-3xl font-semibold">Orders Today</p>
                    <p className="text-7xl font-bold mt-6">{stats.orders}</p>
                </div>
                <div className="p-12 rounded-3xl shadow-2xl text-gray-800 dark:text-gray-900 bg-orange-200">
                    <p className="text-3xl font-semibold">Avg Order</p>
                    <p className="text-7xl font-bold mt-6">{formatRs(stats.avg)}</p>
                </div>
            </div>

            <div className="mt-10 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Daily Sales History</h2>
                    <p className="text-gray-500 dark:text-slate-300 mt-1">Sales and order count by day</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <select
                            value={selectedMonth}
                            onChange={(e) => {
                                setSelectedMonth(e.target.value)
                                setSelectedDay('all')
                            }}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                        >
                            <option value="all">All Months</option>
                            {availableMonths.map((monthKey) => (
                                <option key={monthKey} value={monthKey}>
                                    {new Date(`${monthKey}-01T00:00:00`).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long'
                                    })}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                        >
                            <option value="all">All Days</option>
                            {availableDays.map((dateKey) => (
                                <option key={dateKey} value={dateKey}>
                                    {new Date(`${dateKey}T00:00:00`).toLocaleDateString()}
                                </option>
                            ))}
                        </select>
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
        </div>
    )
}

export default ManagerDashboard