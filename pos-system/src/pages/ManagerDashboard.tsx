import { useState, useEffect } from 'react'

const ManagerDashboard = () => {
    const [stats, setStats] = useState({ sales: 0, orders: 0, avg: 0 })

    useEffect(() => {
        fetch('http://localhost:8080/api/analytics/today')
            .then(res => res.json())
            .then(data => setStats(data))
    }, [])

    return (
        <div>
            <h1 className="text-5xl font-bold mb-10 text-brand">Manager Dashboard</h1>
            <div className="grid grid-cols-3 gap-10">
                <div className="p-12 rounded-3xl shadow-2xl text-gray-800 dark:text-gray-900 bg-blue-200">
                    <p className="text-3xl font-semibold">Total Sales</p>
                    <p className="text-7xl font-bold mt-6">${stats.sales}</p>
                </div>
                <div className="p-12 rounded-3xl shadow-2xl text-gray-800 dark:text-gray-900 bg-green-200">
                    <p className="text-3xl font-semibold">Orders Today</p>
                    <p className="text-7xl font-bold mt-6">{stats.orders}</p>
                </div>
                <div className="p-12 rounded-3xl shadow-2xl text-gray-800 dark:text-gray-900 bg-orange-200">
                    <p className="text-3xl font-semibold">Avg Order</p>
                    <p className="text-7xl font-bold mt-6">${stats.avg}</p>
                </div>
            </div>
        </div>
    )
}

export default ManagerDashboard