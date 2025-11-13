import React from 'react'

const Dashboard = () => {
    return (
        <div>
            <h1 className="text-5xl font-bold  text-black/50 mb-10">Dashboard</h1>
            <div className="grid grid-cols-4 gap-8">
                <div className="bg-white p-10 rounded-2xl shadow-xl">
                    <h3 className="text-2xl text-gray-600">Today's Sales</h3>
                    <p className="text-6xl font-bold text-green-600 mt-4">$3,850</p>
                </div>
                <div className="bg-white p-10 rounded-2xl shadow-xl">
                    <h3 className="text-2xl text-gray-600">Active Tables</h3>
                    <p className="text-6xl font-bold text-blue-600 mt-4">15</p>
                </div>
                <div className="bg-white p-10 rounded-2xl shadow-xl">
                    <h3 className="text-2xl text-gray-600">Pending Orders</h3>
                    <p className="text-6xl font-bold text-orange-600 mt-4">8</p>
                </div>
                <div className="bg-white p-10 rounded-2xl shadow-xl">
                    <h3 className="text-2xl text-gray-600">Avg. Order</h3>
                    <p className="text-6xl font-bold text-purple-600 mt-4">$42</p>
                </div>
            </div>
        </div>
    )
}

export default Dashboard