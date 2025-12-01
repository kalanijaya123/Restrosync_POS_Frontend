import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { Plus, Minus, ShoppingCart, Search, ArrowLeft, Package } from 'lucide-react'

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

interface SelectedExtra {
    extraId: string
    name: string
    price: number
    qty: number
}

interface CartItem {
    menuItemId: string
    name: string
    sizeName: string
    basePrice: number
    qty: number
    extras: SelectedExtra[]
    totalPrice: number // base + extras
}

const OrderEntry = () => {
    const [menu, setMenu] = useState<MenuItem[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [showExtrasModal, setShowExtrasModal] = useState(false)
    const [currentItemForExtras, setCurrentItemForExtras] = useState<{ item: MenuItem; size: Size } | null>(null)
    const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([])

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

    const categories = ['All', ...Array.from(new Set(menu.map(m => m.category || 'Uncategorized')))]

    const filteredMenu = menu
        .filter(item => selectedCategory === 'All' || (item.category || 'Uncategorized') === selectedCategory)
        .filter(item => (item.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()))

    // Open extras modal
    const openExtras = (item: MenuItem, size: Size) => {
        setCurrentItemForExtras({ item, size })
        setSelectedExtras([])
        setShowExtrasModal(true)
    }

    // Add to cart with extras
    const confirmAddToCart = () => {
        if (!currentItemForExtras) return

        const { item, size } = currentItemForExtras
        const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price * e.qty, 0)
        const totalPrice = size.price + extrasTotal

        const newCartItem: CartItem = {
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
                c.menuItemId === newCartItem.menuItemId &&
                c.sizeName === newCartItem.sizeName &&
                JSON.stringify(c.extras) === JSON.stringify(newCartItem.extras)
            )

            if (exists) {
                return prev.map(c => c === exists ? { ...c, qty: c.qty + 1 } : c)
            }
            return [...prev, newCartItem]
        })

        toast.success(`${size.name} ${item.name} + extras added!`)
        setShowExtrasModal(false)
        setCurrentItemForExtras(null)
        setSelectedExtras([])
    }

    // Update cart quantity
    const updateQty = (index: number, change: number) => {
        setCart(prev => {
            const updated = [...prev]
            const newQty = updated[index].qty + change
            if (newQty > 0) {
                updated[index].qty = newQty
            } else {
                updated.splice(index, 1)
            }
            return updated
        })
    }

    const total = cart.reduce((sum, item) => sum + item.totalPrice * item.qty, 0)

    const sendToKitchen = async () => {
        if (cart.length === 0) return toast.error('Cart is empty!')

        const payload = {
            items: cart.map(c => ({
                menuItemId: c.menuItemId,
                name: c.name,
                sizeName: c.sizeName,
                price: c.basePrice,
                qty: c.qty,
                extras: c.extras.map(e => ({
                    extraId: e.extraId,
                    qty: e.qty
                }))
            })),
            total: Math.round(total),
            tableNumber: tableId ? tableId.slice(-4) : null,
            source: tableId ? 'dine-in' : 'takeaway'
        }

        try {
            const res = await fetch('http://localhost:8080/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) throw new Error(await res.text())

            toast.success('Order sent to kitchen!', { duration: 3000 })
            setCart([])
            setTimeout(() => navigate('/tables'), 1500)
        } catch (err: any) {
            toast.error('Failed: ' + err.message)
        }
    }

    // Direct add without extras (moved above return to avoid temporal-dead-zone errors)
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

    return (
        <>
            <Toaster position="top-center" />

            {/* EXTRAS MODAL */}
            {showExtrasModal && currentItemForExtras && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-gradient-to-br from-purple-900 to-black rounded-3xl p-8 max-w-lg w-full border border-purple-600 shadow-2xl">
                        <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">
                            {currentItemForExtras.item.name} ({currentItemForExtras.size.name})
                        </h2>

                        <p className="text-xl mb-6 text-center text-orange-300">
                            Base Price: Rs {currentItemForExtras.size.price}
                        </p>

                        <div className="space-y-4 mb-8">
                            {currentItemForExtras.item.extras?.length ? (
                                currentItemForExtras.item.extras.map(extra => (
                                    <div key={extra.id} className="bg-white/10 rounded-xl p-4 border border-white/20">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-lg">{extra.name}</p>
                                                <p className="text-sm text-gray-400">+Rs {extra.price}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => setSelectedExtras(prev => {
                                                        const exists = prev.find(e => e.extraId === extra.id)
                                                        if (exists) return prev.map(e => e.extraId === extra.id ? { ...e, qty: e.qty + 1 } : e)
                                                        return [...prev, { extraId: extra.id, name: extra.name, price: extra.price, qty: 1 }]
                                                    })}
                                                    className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700"
                                                >
                                                    <Plus className="w-6 h-6" />
                                                </button>
                                                <span className="text-2xl font-bold w-12 text-center">
                                                    {selectedExtras.find(e => e.extraId === extra.id)?.qty || 0}
                                                </span>
                                                <button
                                                    onClick={() => setSelectedExtras(prev => prev.map(e => e.extraId === extra.id ? { ...e, qty: Math.max(0, e.qty - 1) } : e).filter(e => e.qty > 0))}
                                                    className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700"
                                                >
                                                    <Minus className="w-6 h-6" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-400">No extras available</p>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowExtrasModal(false)}
                                className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAddToCart}
                                className="flex-1 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-xl font-bold text-xl"
                            >
                                Add to Cart • Rs {currentItemForExtras.size.price + selectedExtras.reduce((s, e) => s + e.price * e.qty, 0)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-black text-white">
                <div className="flex h-screen">

                    {/* LEFT: MENU */}
                    <div className="w-3/4 p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <button onClick={() => navigate('/tables')} className="flex items-center gap-3 px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20">
                                <ArrowLeft className="w-6 h-6" /> Back
                            </button>
                            {tableId && (
                                <div className="bg-gradient-to-r from-orange-600 to-red-600 px-10 py-5 rounded-2xl shadow-2xl">
                                    <p className="text-lg">Table</p>
                                    <p className="text-4xl font-bold">{tableId.slice(-4).toUpperCase()}</p>
                                </div>
                            )}
                        </div>

                        <h1 className="text-5xl font-extrabold text-center mb-8 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                            Take Order
                        </h1>

                        <div className="max-w-2xl mx-auto mb-8">
                            <div className="relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search dishes..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-14 pr-6 py-5 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 focus:border-cyan-500 text-xl"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mb-10 flex-wrap justify-center">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-8 py-4 rounded-full text-lg font-bold transition ${selectedCategory === cat
                                        ? 'bg-gradient-to-r from-cyan-600 to-purple-600 shadow-xl'
                                        : 'bg-white/10 hover:bg-white/20'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredMenu.map(item => (
                                <div key={item.id} className="bg-white/10 backdrop-blur-2xl rounded-3xl overflow-hidden border border-purple-600/50 hover:border-cyan-500 shadow-2xl hover:scale-105 transition">
                                    {item.mediaUrl ? (
                                        <img src={item.mediaUrl} alt={item.name} className="w-full h-56 object-cover" />
                                    ) : (
                                        <div className="h-56 bg-gradient-to-br from-purple-800 to-pink-800 flex items-center justify-center">
                                            <Package className="w-24 h-24 text-white/30" />
                                        </div>
                                    )}

                                    <div className="p-6">
                                        <h3 className="text-2xl font-bold text-cyan-300 text-center mb-4">{item.name}</h3>

                                        <div className="space-y-3">
                                            {(item.sizes || []).map(size => (
                                                <button
                                                    key={size.name}
                                                    onClick={() => openExtras(item, size)}
                                                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 py-4 rounded-xl font-bold text-xl flex justify-between px-6 shadow-lg"
                                                >
                                                    <span>{size.name}</span>
                                                    <span>Rs {size.price}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {item.extras?.length ? (
                                            <div className="mt-4 text-center">
                                                <p className="text-yellow-400 font-bold flex items-center justify-center gap-2">
                                                    <Package className="w-5 h-5" /> + Extras Available
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: CART */}
                    <div className="w-1/4 bg-black/80 backdrop-blur-2xl border-l border-purple-600 p-8 flex flex-col">
                        <div className="flex items-center gap-4 mb-8">
                            <ShoppingCart className="w-12 h-12 text-cyan-400" />
                            <h2 className="text-3xl font-bold">Cart ({cart.reduce((s, i) => s + i.qty, 0)})</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-6">
                            {cart.length === 0 ? (
                                <p className="text-center text-gray-500 text-xl py-32">Cart is empty</p>
                            ) : (
                                cart.map((item, i) => (
                                    <div key={i} className="bg-white/10 rounded-2xl p-6 border border-purple-600/50">
                                        <div className="flex justify-between mb-3">
                                            <div>
                                                <p className="font-bold text-xl">{item.name}</p>
                                                <p className="text-orange-300">{item.sizeName}</p>
                                                {item.extras.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        {item.extras.map((e, ei) => (
                                                            <p key={ei} className="text-sm text-yellow-400">• {e.name} ×{e.qty}</p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-2xl font-bold text-green-400">
                                                Rs {item.totalPrice * item.qty}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-center gap-10 mt-6">
                                            <button onClick={() => updateQty(i, -1)} className="w-16 h-16 bg-red-600 rounded-full hover:bg-red-700">
                                                <Minus className="w-8 h-8" />
                                            </button>
                                            <span className="text-5xl font-extrabold text-cyan-300">{item.qty}</span>
                                            <button onClick={() => updateQty(i, 1)} className="w-16 h-16 bg-green-600 rounded-full hover:bg-green-700">
                                                <Plus className="w-8 h-8" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="border-t border-purple-600 pt-8 mt-8">
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-3xl font-bold">Total</span>
                                <span className="text-5xl font-extrabold text-green-400">Rs {total}</span>
                            </div>

                            <button
                                onClick={sendToKitchen}
                                disabled={cart.length === 0}
                                className="w-full py-6 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 rounded-2xl font-bold text-3xl disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl"
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