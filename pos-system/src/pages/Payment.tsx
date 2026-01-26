// src/pages/Payment.tsx
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Calendar, Filter } from 'lucide-react'

interface Order {
    id: string
    orderNo?: number
    kotToken?: string
    customerName?: string
    customerPhone?: string
    total?: number
    paymentStatus?: string
    status?: string
    createdAt?: string
    items?: Array<{ menuItemName: string; sizeName: string; qty: number; basePrice: number; extras: any[] }>
}

const Payment = () => {
    const [orders, setOrders] = useState<Order[]>([])
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [method, setMethod] = useState<'cash' | 'card'>('cash')
    const [cashReceived, setCashReceived] = useState('')
    const [showAllOrders, setShowAllOrders] = useState(false)
    const [selectedDate, setSelectedDate] = useState('')

    useEffect(() => {
        fetchAllOrders()
    }, [])

    const fetchAllOrders = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/orders')
            const data = await res.json()
            const ordersList = Array.isArray(data) ? data : [data]
            setOrders(ordersList)
        } catch {
            toast.error("Failed to load orders")
        } finally {
            setLoading(false)
        }
    }

    const handlePayment = async () => {
        if (!selectedOrder) return

        const payload = method === 'cash'
            ? { orderId: selectedOrder.id, paymentMethod: 'cash', amountReceived: Number(cashReceived) }
            : { orderId: selectedOrder.id, paymentMethod: 'card', amountReceived: selectedOrder.total || 0 }

        try {
            // First, process payment
            await fetch('http://localhost:8080/api/payment/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            toast.success("Payment successful!")

            // Update the selected order's payment status locally
            setSelectedOrder(prev => prev ? { ...prev, paymentStatus: 'paid' } : null)

            // Refresh orders list
            fetchAllOrders()
        } catch {
            toast.error("Payment failed")
        }
    }

    const sendToKitchen = async () => {
        if (!selectedOrder) return

        try {
            // Update order status to 'pending' to send to kitchen
            const response = await fetch(`http://localhost:8080/api/orders/${selectedOrder.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'pending' })
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || 'Failed to update status')
            }

            toast.success("Order sent to kitchen!", { duration: 3000 })
            setSelectedOrder(null)
            setCashReceived('')
            setMethod('cash')
            fetchAllOrders()
        } catch (error: any) {
            console.error('Send to kitchen error:', error)
            toast.error(`Failed to send to kitchen: ${error.message}`)
        }
    }

    if (loading) return <div className="p-10 text-4xl text-white">Loading orders...</div>

    // Filter orders based on view mode and date
    const getFilteredOrders = () => {
        let filtered = showAllOrders ? orders : orders.filter(o => o.paymentStatus !== 'paid')

        if (selectedDate) {
            filtered = filtered.filter(order => {
                if (!order.createdAt) return false
                const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
                return orderDate === selectedDate
            })
        }

        return filtered
    }

    const filteredOrders = getFilteredOrders()

    // If no order selected, show order list
    if (!selectedOrder) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white p-8 transition-colors">
                <h1 className="text-5xl font-bold text-center mb-8 text-brand">
                    {showAllOrders ? 'All Orders' : 'Unpaid Orders'}
                </h1>

                {/* Filter Controls */}
                <div className="max-w-6xl mx-auto mb-6 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-4 items-center">
                        <button
                            onClick={() => {
                                setShowAllOrders(!showAllOrders)
                                setSelectedDate('')
                            }}
                            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition ${showAllOrders
                                ? 'bg-brand text-white'
                                : 'bg-gray-800 text-gray-300 border border-gray-600 hover:border-brand'
                                }`}
                        >
                            <Filter className="w-5 h-5" />
                            {showAllOrders ? 'Show Unpaid Only' : 'Show All Orders'}
                        </button>

                        {showAllOrders && (
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-brand" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="px-4 py-3 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 focus:border-brand focus:outline-none"
                                />
                                {selectedDate && (
                                    <button
                                        onClick={() => setSelectedDate('')}
                                        className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-600"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="text-gray-400">
                        Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                    </div>
                </div>

                <div className="max-w-6xl mx-auto">
                    {filteredOrders.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-3xl text-gray-400">
                                {selectedDate
                                    ? `No orders found for ${new Date(selectedDate).toLocaleDateString()}`
                                    : showAllOrders
                                        ? 'No orders available'
                                        : 'No unpaid orders'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredOrders.map((order) => (
                                <div
                                    key={order.id}
                                    onClick={() => setSelectedOrder(order)}
                                    className="bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:border-brand rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-all"
                                >
                                    <div className="mb-4">
                                        <h2 className="text-2xl font-bold text-brand mb-2">
                                            {order.kotToken || `Order #${order.orderNo || 'N/A'}`}
                                        </h2>
                                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${order.paymentStatus === 'paid'
                                            ? 'bg-green-500/20 text-green-300 border border-green-500'
                                            : 'bg-red-500/20 text-red-400 border border-red-500'
                                            }`}>
                                            {order.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
                                        </div>
                                        <div className={`inline-block ml-2 px-3 py-1 rounded-full text-sm font-semibold ${order.status === 'completed'
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                                            : order.status === 'ready'
                                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500'
                                                : 'bg-amber-500/20 text-amber-400 border border-amber-500'
                                            }`}>
                                            {order.status || 'pending'}
                                        </div>
                                    </div>

                                    {order.customerName && (
                                        <p className="text-white text-lg mb-2">
                                            <span className="text-gray-400">Customer:</span> {order.customerName}
                                        </p>
                                    )}

                                    {(order.customerPhone) && (
                                        <p className="text-gray-300 text-sm mb-3">{order.customerPhone}</p>
                                    )}

                                    <div className="border-t border-gray-700 pt-4 mt-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Total:</span>
                                            <span className="text-3xl font-bold text-green-300">
                                                Rs {order.total ? order.total.toFixed(2) : '0.00'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">
                                            {order.items?.length || 0} items
                                        </p>
                                    </div>

                                    <button
                                        className="w-full mt-4 py-3 bg-brand hover:bg-brand/80 text-white font-bold rounded-lg transition disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                                        disabled={order.paymentStatus === 'paid'}
                                    >
                                        {order.paymentStatus === 'paid' ? 'Already Paid' : 'Pay This Order'}
                                    </button>

                                    {order.createdAt && (
                                        <p className="text-xs text-gray-500 text-center mt-2">
                                            {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Payment processing view
    const order = selectedOrder
    const change = method === 'cash' ? Number(cashReceived) - (order.total || 0) : 0

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white p-8 transition-colors">
            <div className="mb-6">
                <button
                    onClick={() => {
                        setSelectedOrder(null)
                        setCashReceived('')
                        setMethod('cash')
                    }}
                    className="px-6 py-3 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-slate-600"
                >
                    ← Back to Orders
                </button>
            </div>

            <h1 className="text-5xl font-bold text-center mb-8 text-brand">Payment</h1>

            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-3xl shadow-xl p-8">
                {/* Order Info */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-brand">
                        {order.kotToken || `Order #${order.orderNo || 'N/A'}`}
                    </h2>
                    <p className="text-xl mt-2 text-white">
                        Customer: <span className="text-gray-300">{order.customerName || 'Walk-in'}</span>
                        {order.customerPhone && <> • <span className="text-gray-300">{order.customerPhone}</span></>}
                    </p>
                    <p className="text-2xl font-bold mt-4">
                        <span className={`${order.paymentStatus === 'paid' ? 'text-green-300' : 'text-red-400'}`}>
                            {order.paymentStatus === 'paid' ? 'PAID' : 'NOT PAID'}
                        </span>
                    </p>
                </div>

                {/* Items */}
                <div className="border-t border-gray-700 pt-4 space-y-3">
                    <h3 className="text-lg font-semibold text-gray-300 mb-3">Order Items:</h3>
                    {order.items && order.items.length > 0 ? (
                        order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-lg bg-gray-100 dark:bg-slate-700 rounded-lg p-4">
                                <span className="text-white">{item.qty} × {item.sizeName} {item.menuItemName}</span>
                                <span className="text-green-300 font-bold">Rs {(item.basePrice * item.qty).toFixed(2)}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-4">No items found</p>
                    )}
                </div>

                <div className="border-t-2 border-brand mt-6 pt-6">
                    <div className="flex justify-between text-3xl font-bold">
                        <span className="text-gray-300">Total</span>
                        <span className="text-green-300">Rs {order.total ? order.total.toFixed(2) : '0.00'}</span>
                    </div>
                </div>

                {order.paymentStatus === 'paid' ? (
                    <div className="text-center py-10">
                        <p className="text-6xl text-green-300 font-bold mb-8">PAID</p>
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={sendToKitchen}
                                className="px-12 py-6 bg-green-600 hover:bg-green-700 text-white text-2xl rounded-lg font-bold"
                            >
                                Send to Kitchen
                            </button>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-12 py-6 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white text-xl rounded-lg"
                            >
                                Back to Orders
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Payment Method */}
                        <div className="mt-10">
                            <p className="text-2xl mb-4 text-white">Payment Method</p>
                            <div className="grid grid-cols-2 gap-6">
                                <button
                                    onClick={() => setMethod('cash')}
                                    className={`py-8 text-3xl font-bold rounded-lg border-2 transition ${method === 'cash'
                                        ? 'bg-brand text-white border-brand'
                                        : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-brand'
                                        }`}
                                >
                                    Cash
                                </button>
                                <button
                                    onClick={() => setMethod('card')}
                                    className={`py-8 text-3xl font-bold rounded-lg border-2 transition ${method === 'card'
                                        ? 'bg-brand text-white border-brand'
                                        : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-brand'
                                        }`}
                                >
                                    Card / Mobile
                                </button>
                            </div>
                        </div>

                        {/* Cash Input */}
                        {method === 'cash' && (
                            <div className="mt-8">
                                <label className="text-2xl text-white">Amount Received</label>
                                <input
                                    type="number"
                                    value={cashReceived}
                                    onChange={(e) => setCashReceived(e.target.value)}
                                    className="w-full mt-3 px-6 py-6 text-4xl border-2 rounded-lg bg-gray-800 text-white border-gray-600 focus:border-brand focus:outline-none"
                                    placeholder="0.00"
                                />
                                {cashReceived && change >= 0 && (
                                    <p className="text-3xl mt-4 text-green-300 font-bold">
                                        Change: Rs {change.toFixed(2)}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Confirm Button */}
                        <button
                            onClick={handlePayment}
                            disabled={method === 'cash' && (!cashReceived || Number(cashReceived) < (order.total || 0))}
                            className="w-full mt-10 py-8 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-4xl font-bold rounded-lg disabled:cursor-not-allowed transition"
                        >
                            {method === 'card' ? 'Charge Card & Complete' : 'Confirm Payment'}
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

export default Payment