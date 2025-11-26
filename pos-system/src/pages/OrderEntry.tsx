import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { Plus, Minus, ShoppingCart, Search, ArrowLeft } from 'lucide-react'

interface Size { name: string; price: number }
interface MenuItem {
    id: string
    name: string
    category: string
    price?: number
    sizes?: Size[]
    imageUrl?: string
}

interface CartItem {
    menuItemId: string
    name: string
    sizeName: string
    price: number
    qty: number
}

const OrderEntry = () => {
    const [menu, setMenu] = useState<MenuItem[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)

    const { tableId } = useParams<{ tableId?: string }>()
    const navigate = useNavigate()

    useEffect(() => {
        fetchMenu()
    }, [])

    const fetchMenu = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/menu')
            if (!res.ok) throw new Error('Failed to load menu')
            const data = await res.json()
            setMenu(Array.isArray(data) ? data : [])
        } catch (err) {
            toast.error('Failed to load menu')
        } finally {
            setLoading(false)
        }
    }

    const categories = ['All', ...Array.from(new Set(menu.map(m => m.category)))]

    const filteredMenu = menu
        .filter(item => selectedCategory === 'All' || item.category === selectedCategory)
        .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

    const addToCart = (item: MenuItem, size: Size) => {
        const newItem: CartItem = {
            menuItemId: item.id,
            name: item.name,
            sizeName: size.name,
            price: size.price,
            qty: 1
        }

        setCart(prev => {
            const exists = prev.find(c => c.menuItemId === newItem.menuItemId && c.sizeName === newItem.sizeName)
            if (exists) {
                return prev.map(c =>
                    c.menuItemId === newItem.menuItemId && c.sizeName === newItem.sizeName
                        ? { ...c, qty: c.qty + 1 }
                        : c
                )
            }
            return [...prev, newItem]
        })

        toast.success(`${size.name} ${item.name} added!`, {
            icon: 'Success',
            style: { background: '#1e1b4b', color: '#fff', borderRadius: '16px', fontWeight: 'bold' }
        })
    }

    const updateQty = (index: number, change: number) => {
        setCart(currentCart => {
            const updated = [...currentCart]
            const newQty = updated[index].qty + change

            if (newQty <= 0) {
                return updated.filter((_, i) => i !== index)
            }

            updated[index] = { ...updated[index], qty: newQty }
            return updated
        })
    }

    const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0)

    const sendToKitchen = async () => {
        if (cart.length === 0) return toast.error('Cart is empty!')

        const payload = {
            items: cart.map(c => ({
                menuItemId: c.menuItemId,
                name: `${c.name} (${c.sizeName})`,
                price: c.price,
                qty: c.qty
            })),
            total: total,
            tableId: tableId || null,
            source: tableId ? 'dine-in' : 'takeaway'
        }

        try {
            // 1. Create the order
            const orderRes = await fetch('http://localhost:8080/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!orderRes.ok) {
                const text = await orderRes.text()
                throw new Error(text || 'Failed to send order')
            }

            const savedOrder = await orderRes.json()

            // 2. Reserve the table (try to use returned order id, with fallbacks)
            if (tableId) {
                const orderId = savedOrder?.id || savedOrder?.orderId || savedOrder?._id || 'pending'

                try {
                    const tableRes = await fetch(`http://localhost:8080/api/tables/${tableId}/occupy`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId })
                    })

                    if (!tableRes.ok) {
                        // Try a fallback payload (some backends expect { orderId: null } or no body)
                        try {
                            await fetch(`http://localhost:8080/api/tables/${tableId}/occupy`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orderId: 'pending' })
                            })
                            toast.success('Order sent to kitchen! Table marked pending.', { icon: 'Sent' })
                        } catch (_) {
                            toast.error('Order sent but table not reserved by server')
                        }
                    } else {
                        toast.success('Order sent to kitchen! Table reserved!', { icon: 'Sent' })
                    }
                } catch (err: any) {
                    toast.error('Order sent but failed to reserve table: ' + (err?.message || 'unknown'))
                }
            } else {
                toast.success('Order sent to kitchen!', { icon: 'Sent' })
            }

            setCart([])
            setTimeout(() => navigate('/tables'), 1000)

        } catch (err: any) {
            toast.error('Failed to send order: ' + err.message)
        }
    }

    return (
        <>
            <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

            <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-black text-white">
                <div className="flex h-screen">

                    {/* LEFT: MENU */}
                    <div className="w-3/4 p-6 overflow-y-auto">
                        {/* Header with Back Button */}
                        <div className="flex items-center justify-between mb-8">
                            <button
                                onClick={() => navigate('/tables')}
                                className="flex items-center gap-3 px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition"
                            >
                                <ArrowLeft className="w-6 h-6" />
                                Back to Tables
                            </button>

                            {tableId && (
                                <div className="bg-gradient-to-r from-red-600 to-pink-700 px-8 py-4 rounded-2xl shadow-2xl">
                                    <p className="text-sm opacity-90">Selected Table</p>
                                    <p className="text-3xl font-extrabold">Table {tableId.slice(-3)}</p>
                                </div>
                            )}
                        </div>

                        <h1 className="text-5xl font-extrabold text-center mb-10 bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
                            Take Order
                        </h1>

                        {/* Search Bar */}
                        <div className="max-w-2xl mx-auto mb-8">
                            <div className="relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                                <input
                                    type="text"
                                    placeholder="Search dishes..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-14 pr-6 py-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-lg focus:outline-none focus:border-pink-500/60 transition placeholder-gray-400"
                                />
                            </div>
                        </div>

                        {/* Category Pills */}
                        <div className="flex gap-3 mb-10 flex-wrap justify-center">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-7 py-3.5 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg ${selectedCategory === cat
                                        ? 'bg-gradient-to-r from-pink-600 to-purple-700 text-white shadow-pink-500/60'
                                        : 'bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Menu Grid */}
                        {loading ? (
                            <div className="flex justify-center py-32">
                                <div className="animate-spin rounded-full h-20 w-20 border-4 border-pink-500 border-t-transparent"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-6 max-w-7xl mx-auto">
                                {filteredMenu.length === 0 ? (
                                    <p className="col-span-4 text-center text-2xl text-gray-400 py-20">No items found</p>
                                ) : (
                                    filteredMenu.map(item => {
                                        const sizes: Size[] = item.sizes && item.sizes.length > 0
                                            ? item.sizes
                                            : [{ name: 'Regular', price: item.price || 0 }]

                                        return (
                                            <div
                                                key={item.id}
                                                className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/60 transition-all hover:shadow-2xl hover:shadow-purple-600/30 hover:-translate-y-2"
                                            >
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover" />
                                                ) : (
                                                    <div className="h-40 bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
                                                        <span className="text-6xl font-bold opacity-50">{item.name[0]}</span>
                                                    </div>
                                                )}

                                                <div className="p-5">
                                                    <h3 className="font-bold text-cyan-300 text-lg mb-4 line-clamp-2">
                                                        {item.name}
                                                    </h3>

                                                    <div className="space-y-3">
                                                        {sizes.map((size, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => addToCart(item, size)}
                                                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3.5 rounded-xl transition-all hover:scale-105 shadow-md flex justify-between px-5"
                                                            >
                                                                <span>{size.name}</span>
                                                                <span>Rs {Number(size.price).toFixed(0)}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: CART */}
                    <div className="w-1/4 bg-black/60 backdrop-blur-2xl border-l border-purple-600/40 p-8 flex flex-col">
                        <div className="flex items-center gap-4 mb-8">
                            <ShoppingCart className="w-12 h-12 text-pink-400" />
                            <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                                Order Cart ({cart.length})
                            </h2>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-5 mb-8">
                            {cart.length === 0 ? (
                                <div className="text-center py-32 text-gray-400">
                                    <ShoppingCart className="w-28 h-28 mx-auto mb-8 opacity-20" />
                                    <p className="text-2xl">Cart is empty</p>
                                </div>
                            ) : (
                                cart.map((c, i) => (
                                    <div key={i} className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/15 hover:border-purple-400/50 transition">
                                        <div className="flex justify-between mb-4">
                                            <div>
                                                <div className="font-bold text-white text-lg">{c.name}</div>
                                                <div className="text-sm text-pink-300 mt-1">{c.sizeName}</div>
                                            </div>
                                            <div className="text-xl font-bold text-green-400">
                                                Rs {(c.price * c.qty).toFixed(0)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-center gap-8">
                                            <button
                                                onClick={() => updateQty(i, -1)}
                                                className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 rounded-full flex items-center justify-center shadow-xl transition-all transform hover:scale-110 active:scale-95"
                                            >
                                                <Minus className="w-6 h-6 text-white" strokeWidth={3} />
                                            </button>

                                            <span className="text-4xl font-extrabold text-cyan-300 min-w-[80px] text-center">
                                                {c.qty}
                                            </span>

                                            <button
                                                onClick={() => updateQty(i, 1)}
                                                className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 rounded-full flex items-center justify-center shadow-xl transition-all transform hover:scale-110 active:scale-95"
                                            >
                                                <Plus className="w-6 h-6 text-white" strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="border-t-4 border-purple-600/60 pt-8">
                            <div className="flex justify-between items-center mb-10">
                                <span className="text-3xl font-bold">Total</span>
                                <span className="text-6xl font-extrabold text-green-400">Rs {total.toFixed(0)}</span>
                            </div>

                            <button
                                onClick={sendToKitchen}
                                disabled={cart.length === 0}
                                className={`w-full py-7 rounded-3xl font-extrabold text-3xl transition-all transform hover:scale-105 shadow-2xl ${cart.length === 0
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 text-white shadow-pink-600/80'
                                    }`}
                            >
                                SEND TO KITCHEN
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default OrderEntry