import React from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

const Dashboard = () => {
    const { data: stats } = useQuery({
        queryKey: ['dashboard'],
        queryFn: () => api.get('/dashboard/stats').then(res => res.data),
    })

    return (
        <div>
            <h1 className="text-5xl font-bold mb-10  text-black">Dashboard</h1>
            <div className="grid grid-cols-4 gap-8">
                <div className="bg-white p-12 rounded-3xl shadow-2xl text-center">
                    <p className="text-7xl font-bold text-green-600">${stats?.todaySales || 0}</p>
                    <p className="text-2xl text-gray-600 mt-4">Today's Sales</p>
                </div>
                <div className="bg-white p-12 rounded-3xl shadow-2xl text-center">
                    <p className="text-7xl font-bold text-blue-600">{stats?.activeTables || 0}</p>
                    <p className="text-2xl text-gray-600 mt-4">Active Tables</p>
                </div>
                <div className="bg-white p-12 rounded-3xl shadow-2xl text-center">
                    <p className="text-7xl font-bold text-orange-600">{stats?.pendingOrders || 0}</p>
                    <p className="text-2xl text-gray-600 mt-4">Pending Orders</p>
                </div>
                <div className="bg-white p-12 rounded-3xl shadow-2xl text-center">
                    <p className="text-7xl font-bold text-purple-600">${stats?.avgOrder || 0}</p>
                    <p className="text-2xl text-gray-600 mt-4">Avg Order</p>
                </div>
            </div>
        </div>
    )
}

export default Dashboard