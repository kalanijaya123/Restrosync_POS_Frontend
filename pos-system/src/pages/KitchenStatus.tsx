import React, { useState, useEffect } from 'react'

const KitchenStatus = () => {
    const [orders, setOrders] = useState([])

    useEffect(() => {
        const interval = setInterval(() => {
            fetch('http://localhost:8080/api/kds/active')
                .then(res => res.json())
                .then(setOrders)
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div>
            <h1 className="text-5xl font-bold mb-10 text-black">Kitchen Status (Live)</h1>
            <div className="grid grid-cols-3 gap-8">
                {orders.map((order: any) => (
                    <div key={order.id} className="bg-yellow-100 border-8 border-yellow-600 p-10 rounded-3xl shadow-2xl">
                        <p className="text-4xl font-bold">Order #{order.id}</p>
                        <p className="text-3xl mt-6">Table {order.table}</p>
                        <p className="text-2xl mt-4">{order.items.join(', ')}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default KitchenStatus