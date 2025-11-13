import React from 'react';
import "tailwindcss";
const Dashboard: React.FC = () => {
    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-5xl font-bold text-gray-800 mb-10">Welcome to POS</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-10 rounded-3xl shadow-2xl text-center">
                        <h2 className="text-3xl font-bold text-green-600">$2,450</h2>
                        <p className="text-gray-600 mt-2 text-xl">Today's Sales</p>
                    </div>
                    <div className="bg-white p-10 rounded-3xl shadow-2xl text-center">
                        <h2 className="text-3xl font-bold text-blue-600">12</h2>
                        <p className="text-gray-600 mt-2 text-xl">Active Tables</p>
                    </div>
                    <div className="bg-white p-10 rounded-3xl shadow-2xl text-center">
                        <h2 className="text-3xl font-bold text-orange-600">5</h2>
                        <p className="text-gray-600 mt-2 text-xl">Pending Orders</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;