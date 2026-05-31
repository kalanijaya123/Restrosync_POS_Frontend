import { useState, useEffect } from 'react'

interface Order {
    id: string
    table: string
    total: number
    time: string
    status: string
}

const OrderHistory = () => {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('http://localhost:8080/api/orders/history')
            .then(res => res.json())
            .then(data => {
                setOrders(data)
                setLoading(false)
            })
    }, [])

    return (
        <div>
            <div className="inline-flex items-center rounded-2xl bg-slate-900 px-6 py-3 mb-10 shadow-lg">
                <h1 className="text-5xl font-bold text-white">Order History</h1>
            </div>
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                {loading ? (
                    <p className="p-20 text-center text-3xl text-gray-600">Loading history...</p>
                ) : (
                    <table className="w-full text-2xl">
                        <thead className="bg-gray-800 text-white">
                            <tr>
                                <th className="py-8 px-10">Order ID</th>
                                <th className="py-8 px-10">Table</th>
                                <th className="py-8 px-10">Total</th>
                                <th className="py-8 px-10">Time</th>
                                <th className="py-8 px-10">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id} className="border-b hover:bg-gray-50">
                                    <td className="py-8 text-center">#{order.id}</td>
                                    <td className="py-8 text-center">{order.table}</td>
                                    <td className="py-8 text-center font-bold">${order.total}</td>
                                    <td className="py-8 text-center">{order.time}</td>
                                    <td className="py-8 text-center">
                                        <span className={`px-6 py-3 rounded-full text-white ${order.status === 'Completed' ? 'bg-green-600' : 'bg-orange-600'}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default OrderHistory