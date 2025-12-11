import React, { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import toast, { Toaster } from 'react-hot-toast'
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Package } from 'lucide-react'

interface OrderItem {
    menuItemName?: string
    name?: string
    qty?: number
    quantity?: number
    price: number
    sizeName?: string
}

interface Order {
    id: string
    items: OrderItem[]
    total: number
    tableId?: string | null
    tableNumber?: string
    createdAt: string
    status: string
    kotToken?: string
    orderNo?: number
    customerName?: string
    customerPhone?: string
    waiterName?: string
    source?: string
}

const OrderSummary = () => {
    const [orders, setOrders] = useState<Order[]>([])
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAllOrders()
    }, [])

    const fetchAllOrders = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/orders')
            if (!res.ok) throw new Error('Failed to load orders')
            const data = await res.json()

            // THIS IS THE MAGIC FIX – CONVERT ARRAY TO REAL DATE
            const parsedOrders = (data || []).map((order: any) => ({
                ...order,
                createdAt: Array.isArray(order.createdAt)
                    ? new Date(
                        order.createdAt[0], // year
                        order.createdAt[1] - 1, // month (0-based!)
                        order.createdAt[2], // day
                        order.createdAt[3] || 0,
                        order.createdAt[4] || 0,
                        order.createdAt[5] || 0
                    ).toISOString()
                    : order.createdAt,
                items: order.items.map((item: any) => ({
                    menuItemName: item.menuItemName,
                    name: item.name,
                    qty: item.qty || item.quantity,
                    quantity: item.quantity,
                    price: item.price,
                    sizeName: item.sizeName
                }))
            }))

            const sorted = parsedOrders.sort((a: any, b: any) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )

            setOrders(sorted)
        } catch (err) {
            toast.error('Failed to load orders')
        } finally {
            setLoading(false)
        }
    }

    const getDaysInMonth = (): Date[] => {
        const start = startOfMonth(currentMonth)
        const end = endOfMonth(currentMonth)
        return eachDayOfInterval({ start, end })
    }

    const getOrdersForDate = (date: Date) => {
        return orders.filter(order =>
            isSameDay(new Date(order.createdAt), date)
        )
    }

    const goToPrevMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
    }

    const goToNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <>
            <Toaster position="top-center" />

            <div className="min-h-screen bg-black text-white p-6">
                <div className="max-w-7xl mx-auto">

                    {/* HEADER */}
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-extrabold text-brand">
                            Order History
                        </h1>
                        <p className="text-gray-400 mt-2">Click any date to view orders</p>
                    </div>

                    {/* BACK BUTTON */}
                    {selectedOrder && (
                        <button
                            onClick={() => {
                                setSelectedOrder(null)
                                setSelectedDate(null)
                            }}
                            className="mb-6 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition"
                        >
                            <ChevronLeft className="w-5 h-5" /> Back to Orders
                        </button>
                    )}

                    {/* ORDER DETAILS VIEW */}
                    {selectedOrder ? (
                        <div className="bg-black/50 backdrop-blur-xl rounded-3xl border border-brand p-8 shadow-2xl">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-bold text-cyan-400">
                                        {selectedOrder.kotToken || `Order #${selectedOrder.orderNo || selectedOrder.id.slice(-6).toUpperCase()}`}
                                    </h2>
                                    <div className="flex flex-wrap gap-4 mt-4 text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-orange-400" />
                                            <span>{format(new Date(selectedOrder.createdAt), 'dd MMM yyyy')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-green-400" />
                                            <span>{format(new Date(selectedOrder.createdAt), 'hh:mm a')}</span>
                                        </div>
                                        {(selectedOrder.tableNumber || selectedOrder.tableId) && (
                                            <div className="flex items-center gap-2">
                                                <User className="w-5 h-5 text-red-400" />
                                                <span>Table {selectedOrder.tableNumber || selectedOrder.tableId}</span>
                                            </div>
                                        )}
                                        {selectedOrder.source && (
                                            <div className="flex items-center gap-2 bg-brand/20 px-3 py-1 rounded-full">
                                                <span className="capitalize">{selectedOrder.source}</span>
                                            </div>
                                        )}
                                    </div>
                                    {selectedOrder.customerName && (
                                        <div className="mt-4 bg-white/5 rounded-lg p-4 border border-white/10">
                                            <p className="text-xs text-gray-400 mb-1">Customer Details</p>
                                            <p className="text-lg font-semibold text-white">{selectedOrder.customerName}</p>
                                            {selectedOrder.customerPhone && (
                                                <p className="text-sm text-gray-300">{selectedOrder.customerPhone}</p>
                                            )}
                                            {selectedOrder.waiterName && (
                                                <p className="text-xs text-gray-400 mt-2">Served by: {selectedOrder.waiterName}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-400">Total Amount</p>
                                    <p className="text-5xl font-extrabold text-green-400">Rs {selectedOrder.total}</p>
                                    <div className="mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold
                                        ${selectedOrder.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                            selectedOrder.status === 'preparing' ? 'bg-amber-500/20 text-amber-400' :
                                            selectedOrder.status === 'pending' ? 'bg-red-500/20 text-red-400' :
                                            'bg-gray-500/20 text-gray-400'}">
                                        {selectedOrder.status}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {selectedOrder.items.map((item, i) => (
                                    <div key={i} className="bg-white/5 rounded-xl p-5 border border-white/10">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <Package className="w-8 h-8 text-orange-400" />
                                                <div>
                                                    <p className="text-xl font-semibold">{item.menuItemName || item.name || 'Item'}</p>
                                                    {item.sizeName && (
                                                        <span className="text-xs bg-brand/30 px-2 py-1 rounded-full text-brand mr-2">
                                                            {item.sizeName}
                                                        </span>
                                                    )}
                                                    <p className="text-sm text-gray-400">Rs {item.price} each</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-bold text-cyan-300">{item.qty || item.quantity || 1}×</p>
                                                <p className="text-lg text-green-400">Rs {item.price * (item.qty || item.quantity || 1)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : selectedDate ? (
                        /* ORDERS FOR SELECTED DATE */
                        <div>
                            <h2 className="text-2xl font-bold text-cyan-400 mb-6">
                                Orders on {format(selectedDate, 'dd MMMM yyyy')}
                            </h2>
                            {getOrdersForDate(selectedDate).length === 0 ? (
                                <p className="text-center text-gray-500 text-xl py-20">No orders on this date</p>
                            ) : (
                                <div className="grid gap-4">
                                    {getOrdersForDate(selectedDate).map(order => (
                                        <div
                                            key={order.id}
                                            onClick={() => setSelectedOrder(order)}
                                            className="bg-black/40 backdrop-blur rounded-2xl p-6 border border-brand/40 hover:border-cyan-500/60 transition cursor-pointer hover:shadow-2xl hover:shadow-cyan-500/20"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="text-xl font-bold text-white">
                                                        {order.kotToken || `Order #${order.orderNo || order.id.slice(-6).toUpperCase()}`}
                                                    </p>
                                                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {format(new Date(order.createdAt), 'hh:mm a')}
                                                        </span>
                                                        {(order.tableNumber || order.tableId) && (
                                                            <span className="flex items-center gap-1">
                                                                <User className="w-4 h-4" />
                                                                Table {order.tableNumber || order.tableId}
                                                            </span>
                                                        )}
                                                        {order.customerName && (
                                                            <span className="flex items-center gap-1 text-cyan-400">
                                                                {order.customerName}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {order.waiterName && (
                                                        <p className="text-xs text-gray-500 mt-1">Served by: {order.waiterName}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-3xl font-extrabold text-green-400">Rs {order.total}</p>
                                                    <p className="text-sm text-gray-400">{order.items.length} items</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* CALENDAR VIEW */
                        <div className="bg-black/50 backdrop-blur-xl rounded-3xl border border-brand p-8 shadow-2xl">
                            <div className="flex justify-between items-center mb-8">
                                <button onClick={goToPrevMonth} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition">
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <h2 className="text-3xl font-bold text-cyan-400">
                                    {format(currentMonth, 'MMMM yyyy')}
                                </h2>
                                <button onClick={goToNextMonth} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition">
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-3 text-center">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="text-sm font-bold text-gray-400 py-3">
                                        {day}
                                    </div>
                                ))}

                                {getDaysInMonth().map((day: Date, idx: number) => {
                                    const dayOrders = getOrdersForDate(day)
                                    const isToday = isSameDay(day, new Date())
                                    const hasOrders = dayOrders.length > 0

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => dayOrders.length > 0 && setSelectedDate(day)}
                                            disabled={!hasOrders}
                                            className={`aspect-square rounded-2xl transition-all text-lg font-semibold
                                                ${hasOrders
                                                    ? 'bg-brand text-white shadow-lg cursor-pointer'
                                                    : 'bg-white/5 text-gray-600 cursor-default'
                                                }
                                                ${isToday ? 'ring-4 ring-orange-500 ring-offset-4 ring-offset-black/50' : ''}
                                            `}
                                        >
                                            <div className="flex flex-col items-center justify-center h-full">
                                                <span>{format(day, 'd')}</span>
                                                {hasOrders && <span className="text-xs mt-1 opacity-80">{dayOrders.length} orders</span>}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default OrderSummary