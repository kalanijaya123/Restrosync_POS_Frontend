import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChefHat, Clock, AlertCircle, Package, AlertOctagon } from 'lucide-react'

interface Order {
    id: string
    table?: string
    tableId?: string | null
    items: {
        menuItemName?: string
        name?: string
        item?: { name: string }
        qty?: number
        quantity?: number
    }[]
    status: 'pending' | 'preparing' | 'ready'
    createdAt: string | number[]
    orderNumber?: string
    orderNo?: number
    kotToken?: string
    customerName?: string
    customerPhone?: string
}

const KitchenStatus = () => {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentTime, setCurrentTime] = useState(new Date())

    const pendingRef = useRef<HTMLDivElement | null>(null)
    const preparingRef = useRef<HTMLDivElement | null>(null)
    const readyRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        let mounted = true
        const fetchOrders = async () => {
            try {
                const res = await fetch('http://localhost:8080/api/orders/kds')
                if (!res.ok) throw new Error(`Server Error ${res.status}`)
                const data = await res.json()
                const list = Array.isArray(data) ? data : []
                if (mounted) {
                    setOrders(list)
                    setError(null)
                }
            } catch (err: any) {
                if (mounted) setError(err.message)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        fetchOrders()
        const interval = setInterval(fetchOrders, 3000)
        return () => { mounted = false; clearInterval(interval) }
    }, [])

    const parseTime = (dateInput: any) => {
        if (!dateInput) return 0
        if (Array.isArray(dateInput)) {
            const [year, month, day, hour = 0, minute = 0, second = 0] = dateInput
            return new Date(year, month - 1, day, hour, minute, second).getTime()
        }
        const t = new Date(dateInput).getTime()
        return Number.isNaN(t) ? 0 : t
    }

    const sortByCreatedAsc = (arr: Order[]) => [...arr].sort((a, b) => (parseTime(a?.createdAt) - parseTime(b?.createdAt)))

    const pending = sortByCreatedAsc(orders.filter(o => o.status === 'pending'))
    const preparing = sortByCreatedAsc(orders.filter(o => o.status === 'preparing'))
    const ready = sortByCreatedAsc(orders.filter(o => o.status === 'ready'))

    const formatTable = (o: Order) => {
        if (o.table) return o.table
        if (o.tableId) return `Table ${o.tableId}`
        return 'Takeaway'
    }

    const getElapsedTime = (createdAt: string | number[]) => {
        const created = new Date(Array.isArray(createdAt)
            ? new Date(createdAt[0], createdAt[1] - 1, createdAt[2], createdAt[3] || 0, createdAt[4] || 0, createdAt[5] || 0)
            : createdAt)
        const now = currentTime
        const diffMs = now.getTime() - created.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffSecs = Math.floor((diffMs % 60000) / 1000)

        if (diffMins > 0) {
            return `${diffMins}m ${diffSecs}s`
        }
        return `${diffSecs}s`
    }

    const scrollColumnToBottom = (ref: React.RefObject<HTMLDivElement | null>) => {
        if (!ref || !ref.current) return
        setTimeout(() => {
            try { ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' }) } catch (e) { }
        }, 80)
    }

    const pendingIds = pending.map(o => String(o.id)).join(',')
    const preparingIds = preparing.map(o => String(o.id)).join(',')
    const readyIds = ready.map(o => String(o.id)).join(',')

    useEffect(() => { scrollColumnToBottom(pendingRef) }, [pendingIds])
    useEffect(() => { scrollColumnToBottom(preparingRef) }, [preparingIds])
    useEffect(() => { scrollColumnToBottom(readyRef) }, [readyIds])

    return (
        <div className="bg-black text-white min-h-screen overflow-auto">
            {/* HEADER */}
            <header className="text-center py-8 border-b border-gray-800">
                <div className="flex items-center justify-center gap-4 mb-3">
                    <ChefHat className="w-10 h-10 text-yellow-400" />
                    <h1 className="text-5xl font-bold text-white">
                        Kitchen Display System
                    </h1>
                    <ChefHat className="w-10 h-10 text-yellow-400" />
                </div>
                <p className="text-lg text-gray-400">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </header>

            {loading && (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent"></div>
                    <p className="text-xl mt-4 text-gray-400">Loading orders...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-900/60 backdrop-blur border border-red-600 rounded-2xl p-8 text-center max-w-2xl mx-auto mt-10">
                    <AlertOctagon className="w-16 h-16 mx-auto mb-4 text-red-400" />
                    <p className="text-2xl font-bold">Connection Failed</p>
                    <p className="text-lg text-red-200 mt-2">{error}</p>
                </div>
            )}

            {!loading && !error && (
                <div className="max-w-screen-2xl mx-auto px-12 py-8 pb-24">
                    <div className="grid grid-cols-3 gap-14 items-start">
                        {/* PENDING COLUMN */}
                        <div className="bg-linear-to-b from-red-900/80 to-red-950/90 rounded-2xl p-6 shadow-lg border border-red-800/40">
                            <h2 className="text-2xl font-bold text-red-300 text-center mb-6 flex items-center justify-center gap-2">
                                <AlertCircle className="w-6 h-6" />
                                PENDING ({pending.length})
                            </h2>
                            <div ref={pendingRef} className="space-y-6 overflow-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                                {pending.length === 0 ? (
                                    <p className="text-center text-gray-500 text-2xl py-20">No pending orders</p>
                                ) : (
                                    pending.map((order) => (
                                        <motion.div
                                            key={order.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-red-800/40 rounded-xl p-5 border border-red-700/50"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-2xl font-bold">{order.kotToken || `Order #${order.orderNo || order.orderNumber || order.id.slice(-6).toUpperCase()}`}</p>
                                                    <p className="text-sm text-gray-300 mt-1">{formatTable(order)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <Clock className="w-5 h-5 inline-block mb-1" />
                                                    <p className="text-lg font-bold">{getElapsedTime(order.createdAt)}</p>
                                                </div>
                                            </div>
                                            {order.customerName && (
                                                <div className="bg-black/20 rounded-lg px-3 py-2 mb-3">
                                                    <p className="text-xs text-gray-400">Customer</p>
                                                    <p className="text-sm font-semibold">{order.customerName}</p>
                                                    {order.customerPhone && <p className="text-xs text-gray-300">{order.customerPhone}</p>}
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <p className="text-xs text-gray-300 font-semibold mb-2 uppercase">Items:</p>
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="bg-black/30 rounded-lg px-4 py-3 flex justify-between items-center">
                                                        <span className="font-bold text-lg">{item.menuItemName || item.name || item.item?.name || `Item ${idx + 1}`}</span>
                                                        <span className="bg-white/20 px-3 py-1 rounded font-bold text-sm">×{item.qty || item.quantity || 1}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* PREPARING COLUMN */}
                        <div className="bg-linear-to-b from-amber-900/80 to-amber-950/90 rounded-2xl p-6 shadow-lg border border-amber-800/40">
                            <h2 className="text-2xl font-bold text-amber-300 text-center mb-6 flex items-center justify-center gap-2">
                                <Clock className="w-6 h-6" />
                                PREPARING ({preparing.length})
                            </h2>
                            <div ref={preparingRef} className="space-y-6 overflow-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                                {preparing.length === 0 ? (
                                    <p className="text-center text-gray-500 text-2xl py-20">All caught up!</p>
                                ) : (
                                    preparing.map((order) => (
                                        <motion.div
                                            key={order.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-amber-800/40 rounded-xl p-5 border border-amber-700/50"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-2xl font-bold">{order.kotToken || `Order #${order.orderNo || order.orderNumber || order.id.slice(-6).toUpperCase()}`}</p>
                                                    <p className="text-sm text-gray-300 mt-1">{formatTable(order)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <Clock className="w-5 h-5 inline-block mb-1" />
                                                    <p className="text-lg font-bold">{getElapsedTime(order.createdAt)}</p>
                                                </div>
                                            </div>
                                            {order.customerName && (
                                                <div className="bg-black/20 rounded-lg px-3 py-2 mb-3">
                                                    <p className="text-xs text-gray-400">Customer</p>
                                                    <p className="text-sm font-semibold">{order.customerName}</p>
                                                    {order.customerPhone && <p className="text-xs text-gray-300">{order.customerPhone}</p>}
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <p className="text-xs text-gray-300 font-semibold mb-2 uppercase">Items:</p>
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="bg-black/30 rounded-lg px-4 py-3 flex justify-between items-center">
                                                        <span className="font-bold text-lg">{item.menuItemName || item.name || item.item?.name || `Item ${idx + 1}`}</span>
                                                        <span className="bg-white/20 px-3 py-1 rounded font-bold text-sm">×{item.qty || item.quantity || 1}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* READY COLUMN */}
                        <div className="bg-linear-to-b from-emerald-900/80 to-emerald-950/90 rounded-2xl p-6 shadow-lg border border-emerald-800/40">
                            <h2 className="text-2xl font-bold text-emerald-300 text-center mb-6 flex items-center justify-center gap-2">
                                <Package className="w-6 h-6" />
                                READY ({ready.length})
                            </h2>
                            <div ref={readyRef} className="space-y-6 overflow-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                                {ready.length === 0 ? (
                                    <p className="text-center text-gray-500 text-2xl py-20">Waiting for orders</p>
                                ) : (
                                    ready.map((order) => (
                                        <motion.div
                                            key={order.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-emerald-800/40 rounded-xl p-5 border border-emerald-700/50"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-2xl font-bold">{order.kotToken || `Order #${order.orderNo || order.orderNumber || order.id.slice(-6).toUpperCase()}`}</p>
                                                    <p className="text-sm text-gray-300 mt-1">{formatTable(order)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <Clock className="w-5 h-5 inline-block mb-1" />
                                                    <p className="text-lg font-bold">{getElapsedTime(order.createdAt)}</p>
                                                </div>
                                            </div>
                                            {order.customerName && (
                                                <div className="bg-black/20 rounded-lg px-3 py-2 mb-3">
                                                    <p className="text-xs text-gray-400">Customer</p>
                                                    <p className="text-sm font-semibold">{order.customerName}</p>
                                                    {order.customerPhone && <p className="text-xs text-gray-300">{order.customerPhone}</p>}
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <p className="text-xs text-gray-300 font-semibold mb-2 uppercase">Items:</p>
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="bg-black/30 rounded-lg px-4 py-3 flex justify-between items-center">
                                                        <span className="font-bold text-lg">{item.menuItemName || item.name || item.item?.name || `Item ${idx + 1}`}</span>
                                                        <span className="bg-white/20 px-3 py-1 rounded font-bold text-sm">×{item.qty || item.quantity || 1}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default KitchenStatus