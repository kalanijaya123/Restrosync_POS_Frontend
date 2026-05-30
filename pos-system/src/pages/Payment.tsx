// src/pages/Payment.tsx
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Calendar, Filter } from 'lucide-react'
import { computeDiscounts, getDiscountSettings } from '../utils/discounts'

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
    const [cardHolderName, setCardHolderName] = useState('')
    const [cardLast4, setCardLast4] = useState('')
    const [cardExpiry, setCardExpiry] = useState('')
    const [cardTransactionRef, setCardTransactionRef] = useState('')
    const [showAllOrders, setShowAllOrders] = useState(false)
    const [selectedDate, setSelectedDate] = useState('')
    const [discountSettings] = useState(getDiscountSettings)

    const normalizePhone = (raw?: string) => {
        if (!raw) return ''
        return raw.replace(/\D/g, '')
    }

    const normalizeCustomerName = (raw?: string) => {
        if (!raw) return ''

        return raw
            .trim()
            .toLowerCase()
            .replace(/^(mr|mrs|miss|dr)\.?\s+/i, '')
            .replace(/\s+/g, ' ')
    }

    const getCustomerIdentity = (order: Order) => {
        const phone = normalizePhone(order.customerPhone)
        if (phone) return `phone:${phone}`

        const normalizedName = normalizeCustomerName(order.customerName)
        if (normalizedName && normalizedName !== 'guest' && normalizedName !== 'walk-in') {
            return `name:${normalizedName}`
        }

        return ''
    }

    const matchesCustomer = (order: Order, customerIdentity: string) => {
        if (!customerIdentity) return false
        return getCustomerIdentity(order) === customerIdentity
    }

    const getDiscountSummary = (order: Order) => {
        const customerIdentity = getCustomerIdentity(order)

        const customerOrders = customerIdentity
            ? orders.filter(item => matchesCustomer(item, customerIdentity))
            : []

        const customerOrderTotals = customerOrders
            .map(item => item.total || 0)
            .filter(total => Number.isFinite(total) && total > 0)

        const customerPaidOrderTotals = customerOrders
            .filter(item => item.paymentStatus === 'paid')
            .map(item => item.total || 0)
            .filter(total => Number.isFinite(total) && total > 0)

        return computeDiscounts({
            subtotal: order.total || 0,
            orderDate: order.createdAt,
            customerOrderTotals,
            customerPaidOrderTotals,
            settings: discountSettings
        })
    }

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

        const summary = getDiscountSummary(selectedOrder)

        if (method === 'card') {
            if (!cardHolderName.trim()) {
                toast.error('Card holder name is required')
                return
            }

            if (cardLast4.trim().length !== 4 || !/^\d{4}$/.test(cardLast4.trim())) {
                toast.error('Enter the last 4 digits of the card')
                return
            }

            if (!cardExpiry.trim()) {
                toast.error('Card expiry is required')
                return
            }
        }

        const payload = method === 'cash'
            ? { orderId: selectedOrder.id, paymentMethod: 'cash', amountReceived: Number(cashReceived) }
            : {
                orderId: selectedOrder.id,
                paymentMethod: 'card',
                amountReceived: summary.payableAmount,
                cardHolderName: cardHolderName.trim(),
                cardLast4: cardLast4.trim(),
                cardExpiry: cardExpiry.trim(),
                cardTransactionRef: cardTransactionRef.trim() || undefined
            }

        try {
            // First, process payment
            const payResponse = await fetch('http://localhost:8080/api/payment/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!payResponse.ok) {
                throw new Error(await payResponse.text() || 'Payment failed')
            }

            // Automatically send paid order to kitchen so inventory is deducted immediately
            const kitchenResponse = await fetch(`http://localhost:8080/api/orders/${selectedOrder.id}/send-to-kitchen`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            })

            if (!kitchenResponse.ok) {
                throw new Error(await kitchenResponse.text() || 'Payment succeeded but failed to send to kitchen')
            }

            toast.success("Payment successful! Order sent to kitchen and inventory updated.")

            // Update the selected order's payment status locally
            setSelectedOrder(null)
            setCashReceived('')
            setMethod('cash')
            setCardHolderName('')
            setCardLast4('')
            setCardExpiry('')
            setCardTransactionRef('')

            // Refresh orders list
            fetchAllOrders()
        } catch (error: any) {
            toast.error(error?.message || "Payment failed")
        }
    }

    const sendToKitchen = async () => {
        if (!selectedOrder) return

        try {
            // Send order to kitchen - this will deduct inventory on the backend
            const response = await fetch(`http://localhost:8080/api/orders/${selectedOrder.id}/send-to-kitchen`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || 'Failed to send to kitchen')
            }

            toast.success("Order sent to kitchen! Inventory updated.", { duration: 3000 })
            setSelectedOrder(null)
            setCashReceived('')
            setMethod('cash')
            setCardHolderName('')
            setCardLast4('')
            setCardExpiry('')
            setCardTransactionRef('')
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
                <div className="flex justify-center mb-8">
                    <div className="inline-flex items-center rounded-2xl bg-slate-900 px-8 py-3 shadow-lg">
                        <h1 className="text-5xl font-bold text-white">
                            {showAllOrders ? 'All Orders' : 'Unpaid Orders'}
                        </h1>
                    </div>
                </div>

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
                                    className="px-4 py-3 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 focus:border-brand focus:outline-none"
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
                                        <p className="text-slate-800 dark:text-white text-lg mb-2">
                                            <span className="text-slate-500 dark:text-gray-400">Customer:</span> {order.customerName}
                                        </p>
                                    )}

                                    {(order.customerPhone) && (
                                        <p className="text-slate-600 dark:text-gray-300 text-sm mb-3">{order.customerPhone}</p>
                                    )}

                                    <div className="border-t border-gray-300 dark:border-gray-700 pt-4 mt-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 dark:text-gray-400">Total:</span>
                                            <span className="text-3xl font-bold text-green-600 dark:text-green-300">
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
    const discountSummary = getDiscountSummary(order)
    const change = method === 'cash' ? Number(cashReceived) - discountSummary.payableAmount : 0

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white p-8 transition-colors">
            <div className="mb-6">
                <button
                    onClick={() => {
                        setSelectedOrder(null)
                        setCashReceived('')
                        setMethod('cash')
                        setCardHolderName('')
                        setCardLast4('')
                        setCardExpiry('')
                        setCardTransactionRef('')
                    }}
                    className="px-6 py-3 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-slate-600"
                >
                    ← Back to Orders
                </button>
            </div>

            <div className="flex justify-center mb-8">
                <div className="inline-flex items-center rounded-2xl bg-slate-900 px-8 py-3 shadow-lg">
                    <h1 className="text-5xl font-bold text-white">Payment</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-3xl shadow-xl p-8">
                {/* Order Info */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-brand">
                        {order.kotToken || `Order #${order.orderNo || 'N/A'}`}
                    </h2>
                    <p className="text-xl mt-2 text-slate-800 dark:text-white">
                        Customer: <span className="text-slate-600 dark:text-gray-300">{order.customerName || 'Walk-in'}</span>
                        {order.customerPhone && <> • <span className="text-slate-600 dark:text-gray-300">{order.customerPhone}</span></>}
                    </p>
                    <p className="text-2xl font-bold mt-4">
                        <span className={`${order.paymentStatus === 'paid' ? 'text-green-300' : 'text-red-400'}`}>
                            {order.paymentStatus === 'paid' ? 'PAID' : 'NOT PAID'}
                        </span>
                    </p>
                </div>

                {/* Items */}
                <div className="border-t border-gray-700 pt-4 space-y-3">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-gray-300 mb-3">Order Items:</h3>
                    {order.items && order.items.length > 0 ? (
                        order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-lg bg-gray-200 dark:bg-slate-700 rounded-lg p-4">
                                <span className="text-slate-900 dark:text-white">{item.qty} × {item.sizeName} {item.menuItemName}</span>
                                <span className="text-green-700 dark:text-green-300 font-bold">Rs {(item.basePrice * item.qty).toFixed(2)}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-4">No items found</p>
                    )}
                </div>

                <div className="border-t-2 border-brand mt-6 pt-6">
                    <div className="space-y-3">
                        <div className="flex justify-between text-lg font-semibold">
                            <span className="text-slate-700 dark:text-gray-300">Subtotal</span>
                            <span className="text-slate-900 dark:text-gray-100">Rs {discountSummary.subtotal.toFixed(2)}</span>
                        </div>

                        {discountSummary.discounts.map((discount) => (
                            <div key={discount.key} className="flex justify-between text-sm">
                                <span className="text-amber-300">{discount.label} ({discount.percent.toFixed(1)}%)</span>
                                <span className="text-amber-300">- Rs {discount.amount.toFixed(2)}</span>
                            </div>
                        ))}

                        {discountSummary.discounts.length > 0 && (
                            <div className="flex justify-between text-base font-semibold border-t border-slate-600 pt-3">
                                <span className="text-orange-300">Discount Applied ({discountSummary.totalDiscountPercent.toFixed(1)}%)</span>
                                <span className="text-orange-300">- Rs {discountSummary.totalDiscountAmount.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-3xl font-bold border-t border-brand pt-4">
                            <span className="text-slate-700 dark:text-gray-300">Payable Total</span>
                            <span className="text-green-700 dark:text-green-300">Rs {discountSummary.payableAmount.toFixed(2)}</span>
                        </div>
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
                                        : 'bg-gray-200 text-gray-800 border-gray-300 hover:border-brand dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
                                        }`}
                                >
                                    Cash
                                </button>
                                <button
                                    onClick={() => setMethod('card')}
                                    className={`py-8 text-3xl font-bold rounded-lg border-2 transition ${method === 'card'
                                        ? 'bg-brand text-white border-brand'
                                        : 'bg-gray-200 text-gray-800 border-gray-300 hover:border-brand dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
                                        }`}
                                >
                                    Card
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
                                    className="w-full mt-3 px-6 py-6 text-4xl border-2 rounded-lg bg-gray-100 text-gray-900 border-gray-300 focus:border-brand focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-600"
                                    placeholder="0.00"
                                />
                                {cashReceived && change >= 0 && (
                                    <p className="text-3xl mt-4 text-green-300 font-bold">
                                        Change: Rs {change.toFixed(2)}
                                    </p>
                                )}
                                {cashReceived && change < 0 && (
                                    <p className="text-lg mt-3 text-red-400 font-semibold">
                                        Need Rs {Math.abs(change).toFixed(2)} more to complete payment.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Card Details */}
                        {method === 'card' && (
                            <div className="mt-8 space-y-4">
                                <p className="text-xl text-blue-300 font-semibold">
                                    Card payment will be charged for the exact payable amount.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-lg text-white">Card Holder Name</label>
                                        <input
                                            type="text"
                                            value={cardHolderName}
                                            onChange={(e) => setCardHolderName(e.target.value)}
                                            className="w-full mt-2 px-5 py-4 text-xl border-2 rounded-lg bg-gray-800 text-white border-gray-600 focus:border-brand focus:outline-none"
                                            placeholder="Name on card"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-lg text-white">Last 4 Digits</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={4}
                                            value={cardLast4}
                                            onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                            className="w-full mt-2 px-5 py-4 text-xl border-2 rounded-lg bg-gray-800 text-white border-gray-600 focus:border-brand focus:outline-none"
                                            placeholder="1234"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-lg text-white">Expiry</label>
                                        <input
                                            type="text"
                                            value={cardExpiry}
                                            onChange={(e) => setCardExpiry(e.target.value)}
                                            className="w-full mt-2 px-5 py-4 text-xl border-2 rounded-lg bg-gray-800 text-white border-gray-600 focus:border-brand focus:outline-none"
                                            placeholder="MM/YY"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-lg text-white">Transaction Reference</label>
                                        <input
                                            type="text"
                                            value={cardTransactionRef}
                                            onChange={(e) => setCardTransactionRef(e.target.value)}
                                            className="w-full mt-2 px-5 py-4 text-xl border-2 rounded-lg bg-gray-800 text-white border-gray-600 focus:border-brand focus:outline-none"
                                            placeholder="Optional reference"
                                        />
                                    </div>
                                </div>

                                <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-4 text-blue-100">
                                    <p className="font-semibold">Charge amount: Rs {discountSummary.payableAmount.toFixed(2)}</p>
                                    <p className="text-sm mt-1 text-blue-200/80">No change is returned for card payments.</p>
                                </div>
                            </div>
                        )}

                        {/* Confirm Button */}
                        <button
                            onClick={handlePayment}
                            disabled={method === 'cash' && (!cashReceived || Number(cashReceived) < discountSummary.payableAmount)}
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