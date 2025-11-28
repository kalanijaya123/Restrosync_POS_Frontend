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

    const { tableId } = useParams<{ tableId: string }>()
    const navigate = useNavigate()

    useEffect(() => {
        fetchMenu()
    }, [])

    const fetchMenu = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/menu')
            if (!res.ok) throw new Error()
            const data = await res.json()
            setMenu(Array.isArray(data) ? data : [])
        } catch {
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

        toast.success(`${size.name} ${item.name} added!`)
    }

    // Update quantity by item identity to avoid index-related glitches
    const updateQty = (menuItemId: string, sizeName: string, change: number) => {
        setCart(prev => {
            const updated = prev.reduce<CartItem[]>((acc, c) => {
                if (c.menuItemId === menuItemId && c.sizeName === sizeName) {
                    const newQty = c.qty + change
                    if (newQty > 0) acc.push({ ...c, qty: newQty })
                    // if newQty <= 0 we drop the item
                } else {
                    acc.push(c)
                }
                return acc
            }, [])
            return updated
        })
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

    const sendToKitchen = async () => {
        if (cart.length === 0) return toast.error('Cart is empty!')

        const payload = {
            items: cart.map(c => ({
                menuItemId: c.menuItemId,
                name: `${c.name} (${c.sizeName})`,
                price: c.price,
                qty: c.qty
            })),
            total: Math.round(total),
            tableId: tableId || null,
            source: tableId ? 'dine-in' : 'takeaway'
        }

        try {
            const orderRes = await fetch('http://localhost:8080/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!orderRes.ok) throw new Error(await orderRes.text())
            const savedOrder = await orderRes.json()

            if (tableId) {
                const occupyRes = await fetch(`http://localhost:8080/api/tables/${tableId}/occupy`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId: savedOrder.id })
                })
                if (!occupyRes.ok) {
                    toast.error('Order sent but table not reserved!')
                }
            }

            toast.success('Order sent to kitchen!', { icon: 'Success' })
            setCart([])
            setTimeout(() => navigate('/tables'), 1000)

        } catch (err: any) {
            toast.error('Failed: ' + err.message)
        }
    }

    return (
        <>
            <Toaster position="top-center" />

            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-black text-white">
                <div className="flex h-screen">

                    {/* LEFT: MENU */}
                    <div className="w-3/4 p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => navigate('/tables')}
                                className="flex items-center gap-2 px-5 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition text-lg"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back
                            </button>

                            {tableId && (
                                <div className="bg-gradient-to-r from-red-600 to-orange-600 px-8 py-4 rounded-2xl shadow-xl border border-red-500/50">
                                    <p className="text-sm opacity-90">Active Table</p>
                                    <p className="text-3xl font-bold">Table {tableId.slice(-4).toUpperCase()}</p>
                                </div>
                            )}
                        </div>

                        <h1 className="text-4xl font-bold text-center mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            Take Order
                        </h1>

                        <div className="max-w-2xl mx-auto mb-6">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search dishes..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-5 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg focus:outline-none focus:border-cyan-500/60 transition text-base"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mb-8 flex-wrap justify-center">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-6 py-2.5 rounded-full text-sm font-medium transition ${selectedCategory === cat
                                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                                        : 'bg-white/10 hover:bg-white/20'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                                {filteredMenu.map(item => {
                                    const sizes: Size[] = item.sizes && item.sizes.length > 0
                                        ? item.sizes
                                        : [{ name: 'Regular', price: item.price || 0 }]

                                    return (
                                        <div
                                            key={item.id}
                                            className="bg-white/5 backdrop-blur rounded-2xl overflow-hidden border border-white/10 hover:border-cyan-400/50 transition hover:-translate-y-1 shadow-lg"
                                        >
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover" />
                                            ) : (
                                                <div className="h-40 bg-gradient-to-br from-indigo-700 to-purple-800 flex items-center justify-center">
                                                    <span className="text-5xl font-bold opacity-30">{item.name[0]}</span>
                                                </div>
                                            )}

                                            <div className="p-4">
                                                <h3 className="font-semibold text-lg text-center mb-3 text-cyan-300">
                                                    {item.name}
                                                </h3>

                                                <div className="space-y-2">
                                                    {sizes.map((size, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => addToCart(item, size)}
                                                            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium py-3 rounded-lg transition text-sm flex justify-between px-4 shadow-md"
                                                        >
                                                            <span>{size.name}</span>
                                                            <span>Rs {size.price}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: CART */}
                    <div className="w-1/4 bg-black/70 backdrop-blur-xl border-l border-purple-600/40 p-6 flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <ShoppingCart className="w-10 h-10 text-cyan-400" />
                            <h2 className="text-2xl font-bold">Cart ({cart.length})</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4">
                            {cart.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">
                                    <ShoppingCart className="w-20 h-20 mx-auto mb-4 opacity-20" />
                                    <p className="text-lg">Cart is empty</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={`${item.menuItemId}_${item.sizeName}`} className="bg-white/10 rounded-xl p-4 border border-white/10">
                                        <div className="flex justify-between mb-2">
                                            <div>
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-sm text-orange-300">{item.sizeName}</p>
                                            </div>
                                            <p className="font-bold text-green-400">
                                                Rs {(item.price * item.qty)}
                                            </p>
                                        </div>

                                        {/* FIXED: + and - now work 1 by 1 and are CLEARLY VISIBLE */}
                                        <div className="flex items-center justify-center gap-8 mt-4">
                                            <button
                                                onClick={() => updateQty(item.menuItemId, item.sizeName, -1)}
                                                className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition shadow-lg border-4 border-red-500"
                                            >
                                                <Minus className="w-8 h-8 text-white" strokeWidth={4} />
                                            </button>

                                            <span className="text-4xl font-extrabold text-cyan-300 min-w-20 text-center">
                                                {item.qty}
                                            </span>

                                            <button
                                                onClick={() => updateQty(item.menuItemId, item.sizeName, 1)}
                                                className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition shadow-lg border-4 border-green-500"
                                            >
                                                <Plus className="w-8 h-8 text-white" strokeWidth={4} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="border-t border-purple-600/50 pt-6 mt-auto">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-xl font-bold">Total</span>
                                <span className="text-4xl font-extrabold text-green-400">
                                    Rs {total}
                                </span>
                            </div>

                            <button
                                onClick={sendToKitchen}
                                disabled={cart.length === 0}
                                className={`w-full py-4 rounded-xl font-bold text-xl transition shadow-lg ${cart.length === 0
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white'
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