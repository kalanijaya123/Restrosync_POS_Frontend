import { useState, useEffect } from 'react'

type Item = {
    name: string
    qty: number
    price: number
}

type Order = {
    tableId: string
    createdAt: string
    items?: Item[]
    total: number
}

const ThirdPartyOrders = () => {
    const [orders, setOrders] = useState<Order[]>([])

    useEffect(() => {
        fetch('http://localhost:8080/api/orders/thirdparty')  // ← CORRECT URL
            .then(r => r.ok ? r.json() : [])
            .then(data => setOrders(Array.isArray(data) ? data : []))
            .catch(() => setOrders([]))
    }, [])

    return (
        <div className="p-10">
            <h1 className="text-4xl font-bold mb-8 text-black">Third-Party Orders</h1>
            {orders.length === 0 ? (
                <p className="text-gray-500">No third-party orders</p>
            ) : (
                <div className="space-y-6">
                    {orders.map((order, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl shadow-lg">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-semibold text-indigo-600">{order.tableId}</h3>
                                <span className="text-sm text-gray-400">
                                    {new Date(order.createdAt).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="mt-4 space-y-2">
                                {order.items?.map((item, j) => (
                                    <div key={j} className="flex justify-between">
                                        <span className="text-gray-800">{item.qty}x <span className="font-medium">{item.name}</span></span>
                                        <span className="text-green-600 font-semibold">${item.price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                <span className="text-gray-700 font-medium">Total</span>
                                <span className="text-indigo-700 font-bold">${order.total.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ThirdPartyOrders