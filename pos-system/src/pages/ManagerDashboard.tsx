import React, { useState, useEffect } from 'react'

const ManagerDashboard = () => {
    const [stats, setStats] = useState({ sales: 0, orders: 0, avg: 0 })

    useEffect(() => {
        fetch('http://localhost:8080/api/analytics/today')
            .then(res => res.json())
            .then(data => setStats(data))
    }, [])

    return (
        <div>
            <h1 className="text-5xl font-bold mb-10 text-black">Manager Dashboard</h1>
            <div className="grid grid-cols-3 gap-10">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-12 rounded-3xl shadow-2xl text-white">
                    <p className="text-3xl">Total Sales</p>
                    <p className="text-7xl font-bold mt-6">${stats.sales}</p>
                </div>
                <div className="bg-gradient-to-br from-green-600 to-teal-700 p-12 rounded-3xl shadow-2xl text-white">
                    <p className="text-3xl">Orders Today</p>
                    <p className="text-7xl font-bold mt-6">{stats.orders}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-600 to-red-700 p-12 rounded-3xl shadow-2xl text-white">
                    <p className="text-3xl">Avg Order</p>
                    <p className="text-7xl font-bold mt-6">${stats.avg}</p>
                </div>
            </div>
        </div>
    )
}

export default ManagerDashboard