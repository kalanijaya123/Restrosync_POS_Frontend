import { useEffect, useMemo, useState } from 'react'
import { Clock3, Package, Truck, TimerReset, RefreshCw } from 'lucide-react'
import { getApiUrl } from '../services/api'

type OnlineItem = {
    menuItemName?: string
    name?: string
    qty?: number
    quantity?: number
    basePrice?: number
    price?: number
}

type OnlineOrder = {
    id: string
    orderNumber: string
    customerName?: string
    customerPhone?: string
    deliveryType?: string
    status?: string
    paymentStatus?: string
    orderedAt?: string
    expectedDeliveryAt?: string
    total?: number
    items?: OnlineItem[]
}

const statusLabel: Record<string, string> = {
    pending_payment: 'Awaiting Payment',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
}

const ThirdPartyOrders = () => {
    const [orders, setOrders] = useState<OnlineOrder[]>([])
    const [loading, setLoading] = useState(true)

    const fetchOrders = async () => {
        try {
            const res = await fetch(getApiUrl('/online-orders'))
            if (!res.ok) throw new Error('Failed to load online orders')
            const data = await res.json()
            setOrders(Array.isArray(data) ? data : [])
        } catch {
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
        const interval = setInterval(fetchOrders, 8000)
        return () => clearInterval(interval)
    }, [])

    const grouped = useMemo(() => {
        const pending = orders.filter(order => order.status === 'pending_payment')
        const active = orders.filter(order => order.status && order.status !== 'pending_payment' && order.status !== 'cancelled')
        const cancelled = orders.filter(order => order.status === 'cancelled')
        return { pending, active, cancelled }
    }, [orders])

    if (loading) {
        return <div className="p-10 text-2xl text-gray-500">Loading online orders...</div>
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-blue-300">Third-Party Orders</h1>
                    <p className="text-gray-400 mt-2">Orders placed from the online ordering system</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {orders.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-gray-400">
                    No online orders yet
                </div>
            ) : (
                <div className="space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold text-amber-300 mb-4">Pending Payment</h2>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {grouped.pending.map(order => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-emerald-300 mb-4">Active Orders</h2>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {grouped.active.map(order => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    </section>

                    {grouped.cancelled.length > 0 && (
                        <section>
                            <h2 className="text-xl font-semibold text-red-300 mb-4">Cancelled</h2>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {grouped.cancelled.map(order => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    )
}

function OrderCard({ order }: { order: OnlineOrder }) {
    const qtyTotal = (order.items || []).reduce((sum, item) => sum + Number(item.qty ?? item.quantity ?? 1), 0)
    const displayTime = order.orderedAt ? new Date(order.orderedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'

    return (
        <div className="rounded-3xl border border-cyan-500/30 bg-slate-900/80 p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <p className="text-emerald-400 font-bold text-lg">{order.orderNumber}</p>
                    <p className="text-white font-semibold">{order.customerName || 'Guest'}</p>
                    <p className="text-sm text-gray-400 flex items-center gap-2 mt-1"><Clock3 className="w-4 h-4" /> {displayTime}</p>
                </div>
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm font-semibold text-blue-200">
                    {statusLabel[order.status || ''] || order.status || 'Unknown'}
                </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-300 mb-4">
                {order.deliveryType === 'delivery' ? <Truck className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                <span className="capitalize">{order.deliveryType || 'pickup'}</span>
                <span className="text-gray-500">•</span>
                <span>{qtyTotal} items</span>
            </div>

            <div className="space-y-3 mb-4">
                {(order.items || []).slice(0, 3).map((item, index) => {
                    const name = item.menuItemName || item.name || 'Item'
                    const qty = Number(item.qty ?? item.quantity ?? 1)
                    const price = Number(item.basePrice ?? item.price ?? 0)
                    return (
                        <div key={index} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                            <div>
                                <p className="font-medium text-white">{qty} × {name}</p>
                                <p className="text-xs text-gray-400">{order.paymentStatus || 'pending'} payment</p>
                            </div>
                            <p className="text-emerald-300 font-semibold">Rs {(qty * price).toFixed(0)}</p>
                        </div>
                    )
                })}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-gray-400 text-sm flex items-center gap-2"><TimerReset className="w-4 h-4" /> Total</span>
                <span className="text-2xl font-bold text-emerald-400">Rs {(order.total || 0).toFixed(0)}</span>
            </div>
        </div>
    )
}

export default ThirdPartyOrders