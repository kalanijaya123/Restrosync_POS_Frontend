import React, { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { Plus, Minus, ShoppingCart, Search } from 'lucide-react'

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

    useEffect(() => { fetchMenu() }, [])

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

    // FILTER BY CATEGORY + SEARCH
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
                        ? { ...c, qty: c.qty + 1 } : c
                )
            }
            return [...prev, newItem]
        })

        toast.success(`${size.name} ${item.name}`, {
            icon: 'Added',
            style: { background: '#1e1b4b', color: '#fff', borderRadius: '12px' }
        })
    }

    const updateQty = (index: number, change: number) => {
        setCart(prev => {
            const updated = [...prev]
            updated[index].qty += change
            return updated[index].qty > 0 ? updated : updated.filter((_, i) => i !== index)
        })
    }

    const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0).toFixed(2)

    const sendToKitchen = async () => {
        if (cart.length === 0) return toast.error('Cart is empty')

        const payload = {
            tableId: "1",
            items: cart.map(c => ({
                menuItemId: c.menuItemId,
                name: `${c.name} (${c.sizeName})`,
                price: c.price,
                qty: c.qty
            })),
            total: Number(total)
        }

        try {
            const res = await fetch('http://localhost:8080/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            if (!res.ok) throw new Error(await res.text())
            toast.success('Order sent to kitchen!', { icon: 'Sent' })
            setCart([])
        } catch (err: any) {
            toast.error('Failed: ' + err.message)
        }
    }

    return (
        <>
            <Toaster position="top-center" toastOptions={{ duration: 2000 }} />

            <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-black text-white">

                <div className="flex h-screen">

                    {/* LEFT: MENU */}
                    <div className="w-3/4 p-6 overflow-y-auto">
                        <h1 className="text-5xl font-extrabold text-center mb-6 bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
                            Take Order
                        </h1>

                        {/* SEARCH BAR */}
                        <div className="max-w-2xl mx-auto mb-6">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search food items..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-lg focus:outline-none focus:border-pink-500/50 transition placeholder-gray-400"
                                />
                            </div>
                        </div>

                        {/* Category Pills */}
                        <div className="flex gap-3 mb-8 flex-wrap justify-center">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 ${selectedCategory === cat
                                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 shadow-xl shadow-purple-500/50'
                                        : 'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* SMALLER, COMPACT MENU CARDS */}
                        {loading ? (
                            <div className="flex justify-center py-32">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-500 border-t-transparent"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-5 max-w-7xl mx-auto">
                                {filteredMenu.length === 0 ? (
                                    <div className="col-span-4 text-center py-20 text-gray-400">
                                        <p className="text-2xl">No items found</p>
                                    </div>
                                ) : (
                                    filteredMenu.map(item => {
                                        const sizes = item.sizes && item.sizes.length > 0
                                            ? item.sizes
                                            : [{ name: 'Regular', price: item.price || 0 }]

                                        return (
                                            <div
                                                key={item.id}
                                                className="bg-white/5 backdrop-blur-xl rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-500/20 hover:scale-105"
                                            >
                                                {/* Image */}
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt={item.name} className="w-full h-32 object-cover" />
                                                ) : (
                                                    <div className="h-32 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                                        <span className="text-4xl font-bold opacity-60">{item.name[0]}</span>
                                                    </div>
                                                )}

                                                {/* Content */}
                                                <div className="p-4">
                                                    <h3 className="font-bold text-sm text-cyan-300 mb-3 line-clamp-2">{item.name}</h3>

                                                    <div className="space-y-2">
                                                        {sizes.map((size, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => addToCart(item, size)}
                                                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-bold py-2.5 rounded-lg transition-all flex justify-between items-center px-3 shadow-md"
                                                            >
                                                                <span>{size.name}</span>
                                                                <span>Rs {size.price.toFixed(0)}</span>
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
                    <div className="w-1/4 bg-black/40 backdrop-blur-2xl border-l border-purple-500/30 p-6 flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <ShoppingCart className="w-9 h-9 text-pink-400" />
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                                Order Cart ({cart.length})
                            </h2>
                        </div>

                        <div className="flex-1 overflow-y-auto mb-6 space-y-3">
                            {cart.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">
                                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                    <p className="text-lg">Cart is empty</p>
                                </div>
                            ) : (
                                cart.map((c, i) => (
                                    <div key={i} className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                                        <div className="flex justify-between mb-2">
                                            <div>
                                                <div className="font-medium text-sm">{c.name}</div>
                                                <div className="text-xs text-pink-300">{c.sizeName}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-green-400">
                                                    Rs {(c.price * c.qty).toFixed(0)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button onClick={() => updateQty(i, -1)} className="w-8 h-8 bg-red-600/80 hover:bg-red-600 rounded-full flex items-center justify-center">
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="font-bold text-lg w-10 text-center">{c.qty}</span>
                                            <button onClick={() => updateQty(i, 1)} className="w-8 h-8 bg-green-600/80 hover:bg-green-600 rounded-full flex items-center justify-center">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="border-t border-purple-500/50 pt-6">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-xl font-bold">Total</span>
                                <span className="text-3xl font-extrabold text-green-400">Rs {total}</span>
                            </div>

                            <button
                                onClick={sendToKitchen}
                                disabled={cart.length === 0}
                                className={`w-full py-5 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-2xl ${cart.length === 0
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 text-white shadow-pink-500/50'
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