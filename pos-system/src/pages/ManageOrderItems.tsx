import { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { Plus, Minus, Search, Package, ArrowLeft, X, ShoppingCart } from 'lucide-react'

interface Size { name: string; price: number }
interface ExtraItem { id: string; name: string; price: number; quantityPerUnit: number; ingredientId: string }
interface MenuItem {
    id: string
    name: string
    category: string
    sizes: Size[]
    mediaUrl?: string
    extras?: ExtraItem[]
}

interface OrderItem {
    menuItemId: string
    name: string
    sizeName: string
    basePrice: number
    qty: number
    extras: any[]
    checked?: boolean
}

interface Order {
    id: string
    orderNo: number
    tableNumber?: string
    tableId?: string
    total: number
    items: OrderItem[]
    status: 'pending' | 'preparing' | 'ready'
    customerName?: string
    kotToken?: string
    createdAt?: string
}

interface CartItem {
    menuItemId: string
    name: string
    sizeName: string
    basePrice: number
    qty: number
    extras: Array<{ extraId: string; name: string; price: number; qty: number }>
    totalPrice: number
}

const ManageOrderItems = () => {
    const [menu, setMenu] = useState<MenuItem[]>([])
    const [orders, setOrders] = useState<Order[]>([])
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [sortMode, setSortMode] = useState<'newest' | 'oldest' | 'orderAsc' | 'orderDesc'>('newest')
    const [cart, setCart] = useState<CartItem[]>([])
    const [loading, setLoading] = useState(true)

    // Modals
    const [showExtrasModal, setShowExtrasModal] = useState(false)
    const [currentItemForExtras, setCurrentItemForExtras] = useState<{ item: MenuItem; size: Size } | null>(null)
    const [selectedExtras, setSelectedExtras] = useState<Array<{ extraId: string; name: string; price: number; qty: number }>>([])

    useEffect(() => {
        fetchMenu()
        fetchOrders()
    }, [])

    const fetchMenu = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/menu')
            if (!res.ok) throw new Error()
            const data = await res.json()
            const safeData = Array.isArray(data) ? data.map((item: any) => ({
                ...item,
                sizes: Array.isArray(item.sizes) ? item.sizes : [],
                extras: Array.isArray(item.extras) ? item.extras : []
            })) : []
            setMenu(safeData)
        } catch (err) {
            toast.error('Failed to load menu')
            setMenu([])
        }
    }

    const fetchOrders = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/orders/kds')
            if (!res.ok) throw new Error()
            const data = await res.json()
            const ordersList = Array.isArray(data) ? data : [data]
            setOrders(ordersList)
            setLoading(false)
        } catch (err) {
            toast.error('Failed to load orders')
            setLoading(false)
        }
    }

    const categories = ['All', ...Array.from(new Set(menu.map(m => m.category || 'Uncategorized')))]
    const filteredMenu = menu
        .filter(item => selectedCategory === 'All' || item.category === selectedCategory)
        .filter(item => item.name?.toLowerCase().includes(searchQuery.toLowerCase()))

    const filteredOrders = orders.filter(order => {
        if (!searchQuery) return true
        const search = searchQuery.toLowerCase()
        return (
            order.tableNumber?.toLowerCase().includes(search) ||
            order.kotToken?.toLowerCase().includes(search) ||
            order.orderNo.toString().includes(search) ||
            order.customerName?.toLowerCase().includes(search)
        )
    })

    const sortedOrders = [...filteredOrders].sort((a, b) => {
        try {
            if (sortMode === 'newest') {
                const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
                const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
                return tb - ta
            }
            if (sortMode === 'oldest') {
                const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
                const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
                return ta - tb
            }
            if (sortMode === 'orderAsc') return (a.orderNo || 0) - (b.orderNo || 0)
            if (sortMode === 'orderDesc') return (b.orderNo || 0) - (a.orderNo || 0)
        } catch (e) {
            return 0
        }
        return 0
    })

    const selectOrder = (order: Order) => {
        setSelectedOrder(order)
        setCart([])
        setSelectedCategory('All')
        setSearchQuery('')
    }

    const openExtras = (item: MenuItem, size: Size) => {
        setCurrentItemForExtras({ item, size })
        setSelectedExtras([])
        setShowExtrasModal(true)
    }

    const confirmAddToCart = () => {
        if (!currentItemForExtras) return
        const { item, size } = currentItemForExtras
        const extrasTotal = selectedExtras.reduce((s, e) => s + e.price * e.qty, 0)
        const totalPrice = size.price + extrasTotal

        const newItem: CartItem = {
            menuItemId: item.id,
            name: item.name,
            sizeName: size.name,
            basePrice: size.price,
            qty: 1,
            extras: selectedExtras,
            totalPrice
        }

        setCart(prev => {
            const exists = prev.find(c =>
                c.menuItemId === newItem.menuItemId &&
                c.sizeName === newItem.sizeName &&
                JSON.stringify(c.extras) === JSON.stringify(newItem.extras)
            )
            if (exists) return prev.map(c => c === exists ? { ...c, qty: c.qty + 1 } : c)
            return [...prev, newItem]
        })

        toast.success(`${size.name} ${item.name} added!`)
        setShowExtrasModal(false)
        setCurrentItemForExtras(null)
        setSelectedExtras([])
    }

    const addToCartDirect = (item: MenuItem, size: Size) => {
        const newItem: CartItem = {
            menuItemId: item.id,
            name: item.name,
            sizeName: size.name,
            basePrice: size.price,
            qty: 1,
            extras: [],
            totalPrice: size.price
        }

        setCart(prev => {
            const exists = prev.find(c => c.menuItemId === item.id && c.sizeName === size.name && c.extras.length === 0)
            if (exists) return prev.map(c => c === exists ? { ...c, qty: c.qty + 1 } : c)
            return [...prev, newItem]
        })
        toast.success(`${size.name} ${item.name} added!`)
    }

    const updateQty = (index: number, change: number) => {
        setCart(prev => {
            const updated = [...prev]
            const newQty = updated[index].qty + change
            if (newQty > 0) updated[index].qty = newQty
            else updated.splice(index, 1)
            return updated
        })
    }

    const total = cart.reduce((sum, item) => sum + item.totalPrice * item.qty, 0)

    const markItemReady = async (itemIndex: number) => {
        if (!selectedOrder) return

        try {
            const res = await fetch(`http://localhost:8080/api/orders/${selectedOrder.id}/items/${itemIndex}/checked`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ checked: true })
            })

            if (!res.ok) throw new Error(await res.text())

            const updated = await res.json()
            setSelectedOrder(updated)
            toast.success('Item marked ready')
        } catch (err: any) {
            toast.error(err?.message || 'Failed to update item')
        }
    }

    const submitAddItems = async () => {
        if (!selectedOrder || cart.length === 0) {
            toast.error('Select items to add')
            return
        }

        const payload = {
            items: cart.map(c => ({
                menuItemId: c.menuItemId,
                sizeName: c.sizeName,
                price: c.basePrice,
                qty: c.qty,
                extras: c.extras.map(e => ({
                    extraId: e.extraId,
                    qty: e.qty
                }))
            })),
            additionalTotal: total
        }

        try {
            const res = await fetch(`http://localhost:8080/api/orders/${selectedOrder.id}/add-items`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) throw new Error(await res.text())

            toast.success('Items added successfully! Order updated.')
            setCart([])
            setSelectedOrder(null)
            fetchOrders()
        } catch (err: any) {
            toast.error('Failed: ' + err.message)
        }
    }

    if (loading) return <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center text-6xl text-brand">Loading...</div>

    return (
        <>
            <Toaster position="top-center" />

            <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white p-6 transition-colors">
                <div className="max-w-7xl mx-auto">
                    {!selectedOrder ? (
                        <>
                            {/* HEADER */}
                            <div className="inline-flex items-center rounded-2xl bg-slate-900 px-6 py-3 mb-10 shadow-lg">
                                <h1 className="text-5xl font-bold text-white">Add Items to Order</h1>
                            </div>
                            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">Select an order to add more items</p>

                            {/* SEARCH + SORT */}
                            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by table number, order #, or customer name..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-14 pr-6 py-2 rounded-2xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-base focus:outline-none focus:ring-2 focus:ring-brand"
                                    />
                                </div>

                                <div className="mt-4 sm:mt-0 w-full sm:w-64">
                                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">Sort</label>
                                    <select
                                        value={sortMode}
                                        onChange={e => setSortMode(e.target.value as any)}
                                        className="w-full px-4 py-2.5 rounded-2xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-base focus:outline-none"
                                    >
                                        <option value="newest">Newest (by time)</option>
                                        <option value="oldest">Oldest (by time)</option>
                                        <option value="orderAsc">Order # Asc</option>
                                        <option value="orderDesc">Order # Desc</option>
                                    </select>
                                </div>
                            </div>

                            {/* ORDERS LIST */}
                            <div className="grid grid-cols-1 gap-6">
                                {sortedOrders.length === 0 ? (
                                    <div className="text-center py-20">
                                        <Package className="w-20 h-20 mx-auto text-gray-400 mb-4" />
                                        <p className="text-3xl text-gray-500">No orders available</p>
                                    </div>
                                ) : (
                                    sortedOrders.map(order => (
                                        <div
                                            key={order.id}
                                            onClick={() => selectOrder(order)}
                                            className="bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl border-2 border-gray-200 dark:border-slate-700 shadow-lg hover:shadow-xl cursor-pointer transition-all"
                                        >
                                            <div className="grid grid-cols-4 gap-6">
                                                <div>
                                                    <p className="text-gray-600 dark:text-gray-400 text-lg">Order #</p>
                                                    <p className="text-4xl font-bold text-brand">{order.orderNo}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600 dark:text-gray-400 text-lg">Table</p>
                                                    <p className="text-3xl font-bold">{order.tableNumber || 'Takeaway'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600 dark:text-gray-400 text-lg">Status</p>
                                                    <p className={`text-2xl font-bold capitalize ${order.status === 'pending' ? 'text-red-600' :
                                                        order.status === 'preparing' ? 'text-orange-600' :
                                                            'text-green-600'
                                                        }`}>
                                                        {order.status}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600 dark:text-gray-400 text-lg">Total</p>
                                                    <p className="text-3xl font-bold text-green-600">Rs {order.total}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* BACK BUTTON */}
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="mb-6 flex items-center gap-2 px-6 py-3 bg-gray-300 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl font-bold text-xl hover:bg-gray-400"
                            >
                                <ArrowLeft className="w-6 h-6" />
                                Back to Orders
                            </button>

                            {/* SELECTED ORDER HEADER */}
                            <div className="bg-gray-50 dark:bg-slate-800 p-8 rounded-2xl mb-10 border-2 border-gray-200 dark:border-slate-700">
                                <div className="grid grid-cols-4 gap-6">
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-400">Order #</p>
                                        <p className="text-4xl font-bold text-brand">{selectedOrder.orderNo}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-400">Table</p>
                                        <p className="text-3xl font-bold">{selectedOrder.tableNumber || 'Takeaway'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-400">Current Total</p>
                                        <p className="text-3xl font-bold text-green-600">Rs {selectedOrder.total}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-400">Items</p>
                                        <p className="text-3xl font-bold">{selectedOrder.items.length}</p>
                                    </div>
                                </div>
                            </div>

                            {/* CURRENT ITEMS */}
                            <div className="mb-10 bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 border-gray-200 dark:border-slate-700">
                                <h2 className="text-3xl font-bold mb-6 text-brand">Current Order Items</h2>
                                <div className="space-y-4">
                                    {selectedOrder.items.filter(item => !item.checked).map((item, idx) => {
                                        const originalIndex = selectedOrder.items.findIndex(current => current === item)
                                        return (
                                            <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-slate-700 p-4 rounded-xl">
                                                <div>
                                                    <p className="text-2xl font-bold">{item.name}</p>
                                                    <p className="text-gray-600 dark:text-gray-400">{item.sizeName} × {item.qty}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-2xl font-bold text-green-600">Rs {item.basePrice * item.qty}</p>
                                                    <button
                                                        onClick={() => markItemReady(originalIndex)}
                                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm"
                                                    >
                                                        Ready
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* MENU CATEGORIES */}
                            <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-6 py-3 rounded-full font-bold text-lg whitespace-nowrap transition-all ${selectedCategory === cat
                                            ? 'bg-brand text-white shadow-lg'
                                            : 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-300'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* MENU SEARCH */}
                            <div className="mb-8">
                                <input
                                    type="text"
                                    placeholder="Search menu items..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full px-6 py-4 rounded-2xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-2xl focus:outline-none focus:ring-2 focus:ring-brand"
                                />
                            </div>

                            {/* MENU GRID */}
                            <div className="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredMenu.map(item => (
                                    <div key={item.id} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-slate-700">
                                        {item.mediaUrl && (
                                            <img src={item.mediaUrl} alt={item.name} className="w-full h-48 object-cover" />
                                        )}
                                        <div className="p-5">
                                            <h3 className="text-2xl font-bold mb-3">{item.name}</h3>
                                            <div className="space-y-3">
                                                {(item.sizes || []).map(size => (
                                                    <div key={size.name} className="flex justify-between items-center">
                                                        <span className="text-xl font-semibold text-gray-600 dark:text-gray-300">{size.name}</span>
                                                        <div className="flex gap-2">
                                                            <span className="text-xl font-bold text-green-600">Rs {size.price}</span>
                                                            {(item.extras || []).length > 0 ? (
                                                                <button
                                                                    onClick={() => openExtras(item, size)}
                                                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold"
                                                                >
                                                                    +Extras
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => addToCartDirect(item, size)}
                                                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold"
                                                                >
                                                                    <Plus className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CART SUMMARY */}
                            <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t-4 border-brand p-6 rounded-t-2xl shadow-2xl">
                                <div className="max-w-7xl mx-auto">
                                    {cart.length > 0 && (
                                        <>
                                            <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                                                <ShoppingCart className="w-8 h-8" />
                                                New Items to Add ({cart.length})
                                            </h3>
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                                                {cart.map((item, idx) => (
                                                    <div key={idx} className="bg-gray-50 dark:bg-slate-700 p-4 rounded-xl">
                                                        <p className="font-bold text-xl mb-2">{item.name} ({item.sizeName})</p>
                                                        <div className="flex justify-between items-center mb-3">
                                                            <button onClick={() => updateQty(idx, -1)} className="w-10 h-10 bg-red-500 text-white rounded-lg"><Minus /></button>
                                                            <span className="text-2xl font-bold">{item.qty}</span>
                                                            <button onClick={() => updateQty(idx, 1)} className="w-10 h-10 bg-green-500 text-white rounded-lg"><Plus /></button>
                                                        </div>
                                                        <p className="text-green-600 font-bold text-lg">Rs {item.totalPrice * item.qty}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center mb-6 bg-blue-50 dark:bg-slate-700 p-6 rounded-2xl border-2 border-brand">
                                                <p className="text-3xl font-bold">Additional Total:</p>
                                                <p className="text-4xl font-bold text-green-600">Rs {total}</p>
                                            </div>
                                            <button
                                                onClick={submitAddItems}
                                                className="w-full py-6 bg-brand hover:bg-blue-700 text-white rounded-xl font-bold text-2xl shadow-xl"
                                            >
                                                Add Items to Order #{selectedOrder.orderNo}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* EXTRAS MODAL */}
            {showExtrasModal && currentItemForExtras && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-40 flex items-center justify-center p-6">
                    <div className="bg-brand rounded-3xl p-8 max-w-lg w-full border border-brand shadow-2xl">
                        <h2 className="text-4xl font-bold text-blue-300 text-center mb-6">
                            {currentItemForExtras.item.name} ({currentItemForExtras.size.name})
                        </h2>

                        <div className="space-y-5">
                            {(currentItemForExtras.item.extras || []).length > 0 ? currentItemForExtras.item.extras!.map(extra => (
                                <div key={extra.id} className="bg-white/10 rounded-xl p-5 flex justify-between items-center">
                                    <div>
                                        <p className="text-xl font-bold">{extra.name}</p>
                                        <p className="text-gray-400">+Rs {extra.price}</p>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <button onClick={() => setSelectedExtras(p => {
                                            const ex = p.find(e => e.extraId === extra.id)
                                            if (ex) return p.map(e => e.extraId === extra.id ? { ...e, qty: e.qty + 1 } : e)
                                            return [...p, { extraId: extra.id, name: extra.name, price: extra.price, qty: 1 }]
                                        })} className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center"><Plus className="text-white" /></button>
                                        <span className="text-3xl font-bold w-16 text-center">
                                            {selectedExtras.find(e => e.extraId === extra.id)?.qty || 0}
                                        </span>
                                        <button onClick={() => setSelectedExtras(p => p.map(e => e.extraId === extra.id ? { ...e, qty: Math.max(0, e.qty - 1) } : e).filter(e => e.qty > 0))} className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center"><Minus className="text-white" /></button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-white text-xl">No extras available</p>
                            )}
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button onClick={() => setShowExtrasModal(false)} className="flex-1 py-5 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-bold text-xl">Cancel</button>
                            <button onClick={confirmAddToCart} className="flex-1 py-5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xl">Add to Cart</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default ManageOrderItems
