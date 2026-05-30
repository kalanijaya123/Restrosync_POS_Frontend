import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Clock3, CookingPot, ExternalLink, Package, RefreshCw, TimerReset, Truck, XCircle } from 'lucide-react'
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
    trackingToken?: string
    customerName?: string
    customerPhone?: string
    deliveryType?: string
    status?: string
    paymentStatus?: string
    paymentMethod?: string
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
    served: 'Served',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
}

const deliveryTypeLabel: Record<string, string> = {
    delivery: 'Online Delivery',
    pickup: 'Online Pickup',
    dine_in: 'Dine In',
    'dine in': 'Dine In'
}

const deliveryTypeClasses: Record<string, string> = {
    delivery: 'border-sky-400/40 bg-sky-500/15 text-sky-200',
    pickup: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
    dine_in: 'border-amber-400/40 bg-amber-500/15 text-amber-200',
    'dine in': 'border-amber-400/40 bg-amber-500/15 text-amber-200'
}

const parseOrderedAt = (value?: string) => {
    const time = value ? new Date(value).getTime() : 0
    return Number.isNaN(time) ? 0 : time
}

const ThirdPartyOrders = () => {
    const [orders, setOrders] = useState<OnlineOrder[]>([])
    const [loading, setLoading] = useState(true)

    const deliveryServices = useMemo(() => ({
        pickme: 'https://pickme.lk',
        uber: 'https://www.uber.com/'
    }), [])

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

    const updateOrderStatus = async (orderId: string, status: string) => {
        try {
            const res = await fetch(`${getApiUrl(`/online-orders/${orderId}/status`)}?status=${encodeURIComponent(status)}`, {
                method: 'PUT'
            })

            if (!res.ok) {
                throw new Error(await res.text() || 'Failed to update order status')
            }

            await fetchOrders()
        } catch (error) {
            console.error('Failed to update online order status:', error)
        }
    }

    const acceptOrderForKitchen = async (orderId: string) => {
        try {
            const res = await fetch(getApiUrl(`/online-orders/${orderId}/accept`), {
                method: 'PUT'
            })

            if (!res.ok) {
                throw new Error(await res.text() || 'Failed to accept online order')
            }

            await fetchOrders()
        } catch (error) {
            console.error('Failed to accept online order:', error)
        }
    }

    const openDeliveryService = (serviceUrl: string) => {
        window.open(serviceUrl, '_blank', 'noopener,noreferrer')
    }

    const grouped = useMemo(() => {
        const byTime = (list: OnlineOrder[]) => [...list].sort((a, b) => parseOrderedAt(a.orderedAt) - parseOrderedAt(b.orderedAt))
        const pending = byTime(orders.filter(order => order.status === 'pending_payment'))
        const active = byTime(orders.filter(order => order.status && !['pending_payment', 'cancelled', 'served'].includes(order.status)))
        const cancelled = byTime(orders.filter(order => order.status === 'cancelled'))
        return { pending, active, cancelled }
    }, [orders])

    if (loading) {
        return <div className="p-10 text-2xl text-gray-500">Loading online orders...</div>
    }

    return (
        <div className="p-8 max-w-7xl mx-auto bg-slate-900 rounded-3xl">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <div className="inline-flex items-center rounded-2xl bg-slate-900 px-6 py-3 shadow-lg">
                        <h1 className="text-4xl font-bold text-white">Third-Party Orders</h1>
                    </div>
                    <p className="text-slate-300 mt-2">Orders placed from the online ordering system</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 dark:bg-white/10 dark:border-white/20 dark:hover:bg-white/20 dark:text-white"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {orders.length === 0 ? (
                <div className="rounded-3xl border border-blue-400/30 bg-blue-950/60 p-10 text-center text-blue-100">
                    No online orders yet
                </div>
            ) : (
                <div className="space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold text-blue-100 mb-4">Pending Payment</h2>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {grouped.pending.map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    displayOrderNumber={grouped.pending.indexOf(order) + 1}
                                    onStatusChange={updateOrderStatus}
                                    onAcceptOrder={acceptOrderForKitchen}
                                    onOpenDeliveryService={openDeliveryService}
                                    deliveryServices={deliveryServices}
                                />
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-blue-100 mb-4">Active Orders</h2>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {grouped.active.map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    displayOrderNumber={grouped.active.indexOf(order) + 1}
                                    onStatusChange={updateOrderStatus}
                                    onAcceptOrder={acceptOrderForKitchen}
                                    onOpenDeliveryService={openDeliveryService}
                                    deliveryServices={deliveryServices}
                                />
                            ))}
                        </div>
                    </section>

                    {grouped.cancelled.length > 0 && (
                        <section>
                            <h2 className="text-xl font-semibold text-blue-100 mb-4">Cancelled</h2>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {grouped.cancelled.map(order => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        displayOrderNumber={grouped.cancelled.indexOf(order) + 1}
                                        onStatusChange={updateOrderStatus}
                                        onAcceptOrder={acceptOrderForKitchen}
                                        onOpenDeliveryService={openDeliveryService}
                                        deliveryServices={deliveryServices}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    )
}

function OrderCard({
    order,
    displayOrderNumber,
    onStatusChange,
    onAcceptOrder,
    onOpenDeliveryService,
    deliveryServices
}: {
    order: OnlineOrder
    displayOrderNumber: number
    onStatusChange: (orderId: string, status: string) => Promise<void>
    onAcceptOrder: (orderId: string) => Promise<void>
    onOpenDeliveryService: (serviceUrl: string) => void
    deliveryServices: { pickme: string; uber: string }
}) {
    const qtyTotal = (order.items || []).reduce((sum, item) => sum + Number(item.qty ?? item.quantity ?? 1), 0)
    const displayTime = order.orderedAt ? new Date(order.orderedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'

    const actionState = (() => {
        if (order.status === 'pending_payment') {
            return {
                title: 'Ready to send to kitchen',
                primaryAction: { label: 'Accept & Send to Kitchen', status: 'accept', icon: CookingPot },
                secondaryAction: { label: 'Reject Order', status: 'cancelled', icon: XCircle },
                showDeliveryLinks: false
            }
        }

        if (order.status === 'confirmed') {
            return {
                title: 'Confirmed - send to kitchen',
                primaryAction: { label: 'Start Preparing', status: 'preparing', icon: CookingPot },
                secondaryAction: { label: 'Reject Order', status: 'cancelled', icon: XCircle },
                showDeliveryLinks: false
            }
        }

        if (order.status === 'preparing') {
            return {
                title: 'In kitchen',
                primaryAction: { label: 'Mark Ready', status: 'ready', icon: BadgeCheck },
                secondaryAction: null,
                showDeliveryLinks: false
            }
        }

        if (order.status === 'ready') {
            return {
                title: 'Ready for handoff',
                primaryAction: { label: 'Order Served', status: 'served', icon: BadgeCheck },
                secondaryAction: null,
                showDeliveryLinks: order.deliveryType === 'delivery'
            }
        }

        if (order.status === 'out_for_delivery') {
            return {
                title: 'On the way',
                primaryAction: { label: 'Mark Delivered', status: 'delivered', icon: BadgeCheck },
                secondaryAction: null,
                showDeliveryLinks: false
            }
        }

        return {
            title: statusLabel[order.status || ''] || order.status || 'Unknown',
            primaryAction: null,
            secondaryAction: null,
            showDeliveryLinks: false
        }
    })()

    const PrimaryIcon = actionState.primaryAction?.icon
    const SecondaryIcon = actionState.secondaryAction?.icon

    return (
        <div className="rounded-3xl border border-slate-200 bg-gray-100/95 p-5 shadow-lg dark:border-slate-700 dark:bg-slate-900/85">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <p className="text-slate-700 dark:text-emerald-300 font-bold text-lg">Order #{displayOrderNumber}</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{order.customerName || 'Guest'}</p>
                    <p className="text-sm text-slate-500 dark:text-gray-400 flex items-center gap-2 mt-1"><Clock3 className="w-4 h-4" /> {displayTime}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-slate-700 border border-slate-200 dark:bg-blue-500/20 dark:text-blue-200 dark:border-transparent">
                        {statusLabel[order.status || ''] || order.status || 'Unknown'}
                    </span>
                    <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${deliveryTypeClasses[order.deliveryType || ''] || 'border-slate-200 bg-white/80 text-slate-700 dark:border-white/20 dark:bg-white/10 dark:text-gray-200'}`}
                    >
                        {deliveryTypeLabel[order.deliveryType || ''] || (order.deliveryType || 'Pickup')}
                    </span>
                </div>
            </div>

            <p className="mb-4 text-sm text-slate-600 dark:text-cyan-200/90">{actionState.title}</p>

            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300 mb-4">
                {order.deliveryType === 'delivery' ? <Truck className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                <span className="capitalize">{order.deliveryType || 'pickup'}</span>
                <span className="text-slate-400 dark:text-gray-500">•</span>
                <span>{qtyTotal} items</span>
            </div>

            <div className="space-y-3 mb-4">
                {(order.items || []).slice(0, 3).map((item, index) => {
                    const name = item.menuItemName || item.name || 'Item'
                    const qty = Number(item.qty ?? item.quantity ?? 1)
                    const price = Number(item.basePrice ?? item.price ?? 0)
                    return (
                        <div key={index} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 border border-slate-200 dark:bg-white/5 dark:border-white/10">
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">{qty} × {name}</p>
                                <p className="text-xs text-slate-500 dark:text-gray-400">{order.paymentMethod || 'cash'} • {order.paymentStatus || 'pending'} payment</p>
                            </div>
                            <p className="text-emerald-600 dark:text-emerald-300 font-semibold">Rs {(qty * price).toFixed(0)}</p>
                        </div>
                    )
                })}
            </div>

            {actionState.showDeliveryLinks && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                        onClick={() => onOpenDeliveryService(deliveryServices.pickme)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20"
                    >
                        PickMe <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onOpenDeliveryService(deliveryServices.uber)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-200 hover:bg-sky-500/20"
                    >
                        Uber <ExternalLink className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="grid gap-3 mb-4">
                {actionState.primaryAction && (
                    <button
                        onClick={() => actionState.primaryAction!.status === 'accept'
                            ? onAcceptOrder(order.id || order.orderNumber || order.trackingToken || '')
                            : onStatusChange(order.id || order.orderNumber || order.trackingToken || '', actionState.primaryAction!.status)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
                    >
                        {PrimaryIcon && <PrimaryIcon className="w-4 h-4" />}
                        {actionState.primaryAction.label}
                    </button>
                )}

                {actionState.secondaryAction && (
                    <button
                        onClick={() => onStatusChange(order.id, actionState.secondaryAction!.status)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 font-semibold text-red-200 hover:bg-red-500/20"
                    >
                        {SecondaryIcon && <SecondaryIcon className="w-4 h-4" />}
                        {actionState.secondaryAction.label}
                    </button>
                )}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-slate-500 dark:text-gray-400 text-sm flex items-center gap-2"><TimerReset className="w-4 h-4" /> Total</span>
                <span className="text-2xl font-bold text-emerald-400">Rs {(order.total || 0).toFixed(0)}</span>
            </div>
        </div>
    )
}

export default ThirdPartyOrders