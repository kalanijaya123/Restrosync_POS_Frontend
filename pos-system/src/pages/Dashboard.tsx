import React, { useState, useEffect } from 'react'

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        activeTables: 0
    })

    useEffect(() => {
        fetch('http://localhost:8080/api/orders/dashboard/stats')
            .then(r => r.ok ? r.json() : { totalOrders: 0, totalRevenue: 0, activeTables: 0 })
            .then(data => setStats(data))
            .catch(() => setStats({ totalOrders: 0, totalRevenue: 0, activeTables: 0 }))
    }, [])

    return (
        <div className="p-10">
            <h1 className="text-4xl font-bold mb-8 text-black">Dashboard</h1>
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-blue-600 text-white p-8 rounded-xl shadow-lg">
                    <h3 className="text-xl">Total Orders</h3>
                    <p className="text-4xl font-bold">{stats.totalOrders}</p>
                </div>
                <div className="bg-green-600 text-white p-8 rounded-xl shadow-lg">
                    <h3 className="text-xl">Revenue</h3>
                    <p className="text-4xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-orange-600 text-white p-8 rounded-xl shadow-lg">
                    <h3 className="text-xl">Active Tables</h3>
                    <p className="text-4xl font-bold">{stats.activeTables}</p>
                </div>
            </div>
        </div>
    )
}

export default Dashboard