import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Clock, AlertCircle, Package, AlertOctagon } from 'lucide-react'

interface Order {
    id: string
    table?: string
    tableId?: string
    items: { name?: string; item?: { name: string } }[]
    status: 'pending' | 'preparing' | 'ready'
    createdAt: string
}

const KitchenStatus = () => {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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

    const pending = orders.filter(o => o.status === 'pending').length
    const preparing = orders.filter(o => o.status === 'preparing').length
    const ready = orders.filter(o => o.status === 'ready').length

    const formatItems = (items: any[]) =>
        items.map(i => i.name || i.item?.name || 'Item').join(', ')

    const formatTable = (o: Order) => o.table || o.tableId || 'Takeaway'

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            {/* HEADER — Clean & Professional */}
            <header className="text-center mb-10">
                <div className="flex items-center justify-center gap-4 mb-3">
                    <ChefHat className="w-10 h-10 text-yellow-400" />
                    <h1 className="text-5xl font-bold text-white">
                        Kitchen Status (Live)
                    </h1>
                    <ChefHat className="w-10 h-10 text-yellow-400" />
                </div>
                <p className="text-lg text-gray-300">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </header>

            {/* STATS CARDS — Standard Size */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
                <motion.div whileHover={{ scale: 1.03 }} className="bg-red-900/40 backdrop-blur border border-red-700 rounded-2xl p-6 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
                    <div className="text-4xl font-bold text-red-300">{pending}</div>
                    <div className="text-lg text-red-200">Pending</div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.03 }} className="bg-amber-900/40 backdrop-blur border border-amber-700 rounded-2xl p-6 text-center">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-amber-400" />
                    <div className="text-4xl font-bold text-amber-300">{preparing}</div>
                    <div className="text-lg text-amber-200">Preparing</div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.03 }} className="bg-emerald-900/40 backdrop-blur border border-emerald-700 rounded-2xl p-6 text-center">
                    <Package className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
                    <div className="text-4xl font-bold text-emerald-300">{ready}</div>
                    <div className="text-lg text-emerald-200">Ready</div>
                </motion.div>
            </div>

            {/* ORDERS GRID — Perfect Standard Size */}
            <div className="max-w-7xl mx-auto">
                {loading && (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                        <p className="text-xl mt-4 text-gray-400">Loading orders...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/60 backdrop-blur border border-red-600 rounded-2xl p-8 text-center max-w-2xl mx-auto">
                        <AlertOctagon className="w-16 h-16 mx-auto mb-4 text-red-400" />
                        <p className="text-2xl font-bold">Connection Failed</p>
                        <p className="text-lg text-red-200 mt-2">{error}</p>
                    </div>
                )}

                <AnimatePresence mode="popLayout">
                    {orders.length === 0 && !loading && !error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                            <Package className="w-20 h-20 mx-auto mb-6 text-gray-600" />
                            <p className="text-3xl font-bold text-gray-500">No Active Orders</p>
                            <p className="text-xl text-gray-400 mt-3">Kitchen is all caught up!</p>
                        </motion.div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {orders.map((order, i) => (
                            <motion.div
                                key={order.id}
                                layout
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i * 0.05 }}
                                className={`rounded-2xl p-6 shadow-xl border-2
                  ${order.status === 'pending' ? 'bg-red-600 border-red-500' :
                                        order.status === 'preparing' ? 'bg-amber-600 border-amber-500' :
                                            'bg-emerald-600 border-emerald-500'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-sm font-medium bg-black/40 px-3 py-1 rounded-full uppercase tracking-wider">
                                        {order.status}
                                    </span>
                                    <span className="text-xs text-gray-300">#{order.id}</span>
                                </div>

                                <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
                                    <p className="text-sm text-gray-300">Table</p>
                                    <p className="text-2xl font-bold text-yellow-300">{formatTable(order)}</p>
                                </div>

                                <div className="space-y-2 text-sm">
                                    {order.items.slice(0, 5).map((item, idx) => (
                                        <p key={idx} className="bg-black/20 rounded-lg px-3 py-2">
                                            {item.name || item.item?.name || 'Item'}
                                        </p>
                                    ))}
                                    {order.items.length > 5 && (
                                        <p className="text-xs text-gray-400 text-center">+ {order.items.length - 5} more</p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </AnimatePresence>
            </div>
        </div>
    )
}

export default KitchenStatus