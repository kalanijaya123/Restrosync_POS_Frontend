import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, AlertCircle, Package, AlertOctagon, Plus } from 'lucide-react'

interface Order {
    id: string
    table?: string
    tableId?: string | null
    items: {
        menuItemName?: string
        name?: string
        item?: { name: string; mediaUrl?: string }
        qty?: number
        quantity?: number
        mediaUrl?: string
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
    const navigate = useNavigate()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [menuItems, setMenuItems] = useState<any[]>([])

    const pendingRef = useRef<HTMLDivElement | null>(null)
    const preparingRef = useRef<HTMLDivElement | null>(null)
    const readyRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    // Fetch menu items for images
    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const res = await fetch('http://localhost:8080/api/menu')
                if (res.ok) {
                    const data = await res.json()
                    setMenuItems(Array.isArray(data) ? data : [])
                }
            } catch (err) {
                console.error('Failed to load menu:', err)
            }
        }
        fetchMenu()
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

    const getMenuItemImage = (itemName: string) => {
        const menuItem = menuItems.find(m => m.name?.toLowerCase() === itemName?.toLowerCase())
        return menuItem?.mediaUrl || null
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
                    <h1 className="text-5xl font-bold text-white">
                        Kitchen Display System
                    </h1>
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
                        <div className="bg-linear-to-b from-red-200 to-red-100 dark:from-red-200/30 dark:to-red-100/20 rounded-2xl p-6 shadow-lg border-2 border-red-300">
                            <h2 className="text-2xl font-bold text-red-700 dark:text-red-300 text-center mb-6 flex items-center justify-center gap-2">
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
                                            className="bg-white/60 dark:bg-red-900/30 rounded-xl p-5 border-2 border-red-400 shadow-lg"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{order.kotToken || `Order #${order.orderNo || order.orderNumber || order.id.slice(-6).toUpperCase()}`}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{formatTable(order)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <Clock className="w-5 h-5 inline-block mb-1 text-red-600 dark:text-red-400" />
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{getElapsedTime(order.createdAt)}</p>
                                                </div>
                                            </div>
                                            {order.customerName && (
                                                <div className="bg-red-100 dark:bg-black/20 rounded-lg px-3 py-2 mb-3">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Customer</p>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.customerName}</p>
                                                    {order.customerPhone && <p className="text-xs text-gray-700 dark:text-gray-300">{order.customerPhone}</p>}
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <p className="text-xs text-gray-600 dark:text-gray-300 font-semibold mb-2 uppercase">Items:</p>
                                                {order.items.map((item, idx) => {
                                                    const itemName = item.menuItemName || item.name || item.item?.name || ''
                                                    const imageUrl = item.mediaUrl || item.item?.mediaUrl || getMenuItemImage(itemName)
                                                    return (
                                                        <div key={idx} className="bg-red-50 dark:bg-black/30 rounded-lg px-4 py-3 flex gap-3 items-center">
                                                            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                                {imageUrl ? (
                                                                    <img src={imageUrl} alt={itemName} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Package className="w-8 h-8 text-gray-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="font-bold text-lg text-gray-900 dark:text-white">{itemName || `Item ${idx + 1}`}</span>
                                                            </div>
                                                            <span className="bg-red-300 dark:bg-white/20 px-3 py-1 rounded font-bold text-sm text-gray-900 dark:text-white">×{item.qty || item.quantity || 1}</span>
                                                        </div>
                                                    )
                                                })
                                                }
                                            </div>
                                            <button
                                                onClick={() => navigate('/manage-items')}
                                                className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <Plus className="w-5 h-5" />
                                                Add Items to Order
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* PREPARING COLUMN */}
                        <div className="bg-linear-to-b from-orange-200 to-orange-100 dark:from-orange-200/30 dark:to-orange-100/20 rounded-2xl p-6 shadow-lg border-2 border-orange-300">
                            <h2 className="text-2xl font-bold text-orange-700 dark:text-orange-300 text-center mb-6 flex items-center justify-center gap-2">
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
                                            className="bg-white/60 dark:bg-orange-900/30 rounded-xl p-5 border-2 border-orange-400 shadow-lg"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{order.kotToken || `Order #${order.orderNo || order.orderNumber || order.id.slice(-6).toUpperCase()}`}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{formatTable(order)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <Clock className="w-5 h-5 inline-block mb-1 text-orange-600 dark:text-orange-400" />
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{getElapsedTime(order.createdAt)}</p>
                                                </div>
                                            </div>
                                            {order.customerName && (
                                                <div className="bg-orange-100 dark:bg-black/20 rounded-lg px-3 py-2 mb-3">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Customer</p>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.customerName}</p>
                                                    {order.customerPhone && <p className="text-xs text-gray-700 dark:text-gray-300">{order.customerPhone}</p>}
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <p className="text-xs text-gray-600 dark:text-gray-300 font-semibold mb-2 uppercase">Items:</p>
                                                {order.items.map((item, idx) => {
                                                    const itemName = item.menuItemName || item.name || item.item?.name || ''
                                                    const imageUrl = item.mediaUrl || item.item?.mediaUrl || getMenuItemImage(itemName)
                                                    return (
                                                        <div key={idx} className="bg-orange-50 dark:bg-black/30 rounded-lg px-4 py-3 flex gap-3 items-center">
                                                            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                                {imageUrl ? (
                                                                    <img src={imageUrl} alt={itemName} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Package className="w-8 h-8 text-gray-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="font-bold text-lg text-gray-900 dark:text-white">{itemName || `Item ${idx + 1}`}</span>
                                                            </div>
                                                            <span className="bg-orange-300 dark:bg-white/20 px-3 py-1 rounded font-bold text-sm text-gray-900 dark:text-white">×{item.qty || item.quantity || 1}</span>
                                                        </div>
                                                    )
                                                })
                                                }
                                            </div>
                                            <button
                                                onClick={() => navigate('/manage-items')}
                                                className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <Plus className="w-5 h-5" />
                                                Add Items to Order
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* READY COLUMN */}
                        <div className="bg-linear-to-b from-green-200 to-green-100 dark:from-green-200/30 dark:to-green-100/20 rounded-2xl p-6 shadow-lg border-2 border-green-300">
                            <h2 className="text-2xl font-bold text-green-700 dark:text-green-300 text-center mb-6 flex items-center justify-center gap-2">
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
                                            className="bg-white/60 dark:bg-green-900/30 rounded-xl p-5 border-2 border-green-400 shadow-lg"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{order.kotToken || `Order #${order.orderNo || order.orderNumber || order.id.slice(-6).toUpperCase()}`}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{formatTable(order)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <Clock className="w-5 h-5 inline-block mb-1 text-green-600 dark:text-green-400" />
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{getElapsedTime(order.createdAt)}</p>
                                                </div>
                                            </div>
                                            {order.customerName && (
                                                <div className="bg-green-100 dark:bg-black/20 rounded-lg px-3 py-2 mb-3">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Customer</p>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.customerName}</p>
                                                    {order.customerPhone && <p className="text-xs text-gray-700 dark:text-gray-300">{order.customerPhone}</p>}
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <p className="text-xs text-gray-600 dark:text-gray-300 font-semibold mb-2 uppercase">Items:</p>
                                                {order.items.map((item, idx) => {
                                                    const itemName = item.menuItemName || item.name || item.item?.name || ''
                                                    const imageUrl = item.mediaUrl || item.item?.mediaUrl || getMenuItemImage(itemName)
                                                    return (
                                                        <div key={idx} className="bg-green-50 dark:bg-black/30 rounded-lg px-4 py-3 flex gap-3 items-center">
                                                            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                                {imageUrl ? (
                                                                    <img src={imageUrl} alt={itemName} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Package className="w-8 h-8 text-gray-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="font-bold text-lg text-gray-900 dark:text-white">{itemName || `Item ${idx + 1}`}</span>
                                                            </div>
                                                            <span className="bg-green-300 dark:bg-white/20 px-3 py-1 rounded font-bold text-sm text-gray-900 dark:text-white">×{item.qty || item.quantity || 1}</span>
                                                        </div>
                                                    )
                                                })
                                                }
                                            </div>
                                            <button
                                                onClick={() => navigate('/manage-items')}
                                                className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <Plus className="w-5 h-5" />
                                                Add Items to Order
                                            </button>
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