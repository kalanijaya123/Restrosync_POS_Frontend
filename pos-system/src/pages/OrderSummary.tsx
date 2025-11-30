import React, { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import toast, { Toaster } from 'react-hot-toast'
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Package } from 'lucide-react'

interface OrderItem {
    name: string
    qty: number
    price: number
}

interface Order {
    id: string
    items: OrderItem[]
    total: number
    tableId?:string | null
    tableNumber?: string
    createdAt: string
    status: string
}

const OrderSummary = () => {
    const [orders, setOrders] = useState<Order[]>([])
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
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
                name: item.name,
                qty: item.qty,
                price: item.price
            }))
        }))

        const sorted = parsedOrders.sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        setOrders(sorted)
        setFilteredOrders(sorted)
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
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <>
            <Toaster position="top-center" />

            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-black text-white p-6">
                <div className="max-w-7xl mx-auto">

                    {/* HEADER */}
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
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
                        <div className="bg-black/50 backdrop-blur-xl rounded-3xl border border-purple-600/50 p-8 shadow-2xl">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-bold text-cyan-400">Order #{selectedOrder.id.slice(-6).toUpperCase()}</h2>
                                    <div className="flex gap-6 mt-4 text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-orange-400" />
                                            <span>{format(new Date(selectedOrder.createdAt), 'dd MMM yyyy')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-green-400" />
                                            <span>{format(new Date(selectedOrder.createdAt), 'hh:mm a')}</span>
                                        </div>
                                        {selectedOrder.tableNumber && (
                                            <div className="flex items-center gap-2">
                                                <User className="w-5 h-5 text-red-400" />
                                                <span>Table {selectedOrder.tableNumber}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-400">Total Amount</p>
                                    <p className="text-5xl font-extrabold text-green-400">Rs {selectedOrder.total}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {selectedOrder.items.map((item, i) => (
                                    <div key={i} className="bg-white/5 rounded-xl p-5 border border-white/10">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <Package className="w-8 h-8 text-orange-400" />
                                                <div>
                                                    <p className="text-xl font-semibold">{item.name}</p>
                                                    <p className="text-sm text-gray-400">Rs {item.price} each</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-bold text-cyan-300">{item.qty}×</p>
                                                <p className="text-lg text-green-400">Rs {item.price * item.qty}</p>
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
                                            className="bg-black/40 backdrop-blur rounded-2xl p-6 border border-purple-600/40 hover:border-cyan-500/60 transition cursor-pointer hover:shadow-2xl hover:shadow-cyan-500/20"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-xl font-bold text-white">Order #{order.id.slice(-6).toUpperCase()}</p>
                                                    <div className="flex gap-4 mt-2 text-sm text-gray-400">
                                                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {format(new Date(order.createdAt), 'hh:mm a')}</span>
                                                        {order.tableNumber && <span className="flex items-center gap-1"><User className="w-4 h-4" /> Table {order.tableNumber}</span>}
                                                    </div>
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
                        <div className="bg-black/50 backdrop-blur-xl rounded-3xl border border-purple-600/50 p-8 shadow-2xl">
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
                                                    ? 'bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/50 cursor-pointer'
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