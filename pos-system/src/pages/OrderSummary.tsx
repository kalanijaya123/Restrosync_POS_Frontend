import React, { useState, useEffect } from 'react'

interface OrderItem {
    name: string
    qty: number
    price: number
}

const OrderSummary = () => {
    const [items, setItems] = useState<OrderItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('http://localhost:8080/api/orders/current')
            .then(res => res.json())
            .then(data => {
                setItems(data.items || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)

    return (
        <div>
            <h1 className="text-5xl font-bold mb-10 text-black">Order Summary</h1>
            <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-4xl">
                {loading ? (
                    <p className="text-3xl text-center py-20">Loading order...</p>
                ) : items.length === 0 ? (
                    <p className="text-3xl text-center py-20 text-gray-500">No items in order</p>
                ) : (
                    <>
                        {items.map((item, i) => (
                            <div key={i} className="flex justify-between py-6 border-b text-2xl">
                                <span>{item.qty} × {item.name}</span>
                                <span className="font-bold">${(item.price * item.qty).toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="mt-10 text-4xl font-bold text-right">
                            Total: ${total.toFixed(2)}
                        </div>
                        <button className="w-full mt-10 bg-green-600 hover:bg-green-700 text-white py-8 rounded-2xl text-3xl font-bold">
                            Proceed to Payment
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

export default OrderSummary