import React, { useState, useEffect } from 'react'

interface OrderItem {
    name: string
    qty: number
    price: number
}

const OrderSummary = () => {
    const [items, setItems] = useState<OrderItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [orders, setOrders] = useState<any[]>([])

    useEffect(() => {
        const load = async () => {
            try {
                console.log('OrderSummary: fetching current order')
                const res = await fetch('http://localhost:8080/api/orders/current')
                if (!res.ok) {
                    const txt = await res.text().catch(() => '')
                    throw new Error(`HTTP ${res.status} ${txt}`)
                }
                const data = await res.json()
                console.log('OrderSummary: got data', data)
                // If API returned an array of orders, show the list
                if (Array.isArray(data)) {
                    setOrders(data)
                } else {
                    setItems(data.items || [])
                }
            } catch (err: any) {
                console.error('OrderSummary fetch error', err)
                setError(err?.message || String(err))
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)

    return (
        <div>
            <h1 className="text-5xl font-bold mb-10 text-indigo-900">Order Summary</h1>
            <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-4xl">
                {loading ? (
                    <p className="text-3xl text-center py-20">Loading order...</p>
                ) : error ? (
                    <div className="text-red-600 text-lg p-6">
                        <strong>Error loading order:</strong>
                        <pre className="whitespace-pre-wrap mt-2 text-sm text-gray-700">{error}</pre>
                        <p className="mt-4 text-sm text-gray-600">Check backend is running and open browser devtools network/console for details.</p>
                    </div>
                ) : orders.length > 0 ? (
                    <div className="space-y-6">
                        {orders.map((ord, idx) => (
                            <div key={ord.id || idx} className="p-6 border rounded-lg bg-gray-50">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <div className="text-lg font-semibold text-indigo-800">Order #{ord.id}</div>
                                        <div className="text-sm font-medium text-yellow-600">Table: {ord.tableId ?? '—'}</div>
                                    </div>
                                    <div className="text-2xl font-bold text-green-700">${(ord.total ?? 0).toFixed(2)}</div>
                                </div>
                                <div className="space-y-2">
                                    {(ord.items || []).map((it: any, i: number) => (
                                        <div key={i} className="flex justify-between text-lg">
                                            <div className="text-gray-800">{it.qty} × {it.name || it.item?.name || 'Item'}</div>
                                            <div className="font-semibold text-amber-600">${((it.price ?? it.item?.price) * (it.qty ?? 1)).toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
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