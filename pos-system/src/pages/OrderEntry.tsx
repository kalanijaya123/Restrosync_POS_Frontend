// src/pages/OrderEntry.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { Plus, Minus, ShoppingCart, ArrowLeft, Package, User, X } from 'lucide-react'

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
interface SelectedExtra { extraId: string; name: string; price: number; qty: number }
interface CartItem {
    menuItemId: string
    name: string
    sizeName: string
    basePrice: number
    qty: number
    extras: SelectedExtra[]
    totalPrice: number
}

const OrderEntry = () => {
    const [menu, setMenu] = useState<MenuItem[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [tableNumber, setTableNumber] = useState<string | null>(null)

    // Modals
    const [showExtrasModal, setShowExtrasModal] = useState(false)
    const [currentItemForExtras, setCurrentItemForExtras] = useState<{ item: MenuItem; size: Size } | null>(null)
    const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([])

    const [showCustomerModal, setShowCustomerModal] = useState(false)
    const [title, setTitle] = useState<'Mr' | 'Mrs' | 'Miss' | 'Dr' | ''>('')
    const [customerName, setCustomerName] = useState('')
    const [countryCode, setCountryCode] = useState('+94')
    const [phoneNumber, setPhoneNumber] = useState('')

    const { tableId } = useParams<{ tableId: string }>()
    const navigate = useNavigate()

    useEffect(() => {
        fetchMenu()
        if (tableId) {
            fetchTableDetails()
        }
    }, [])

    const fetchTableDetails = async () => {
        try {
            const res = await fetch(`http://localhost:8080/api/tables/${tableId}`)
            if (!res.ok) throw new Error()
            const data = await res.json()
            setTableNumber(data.number)  // Store the actual table number like "T1", "VIP-3"
        } catch (err) {
            console.error('Failed to fetch table details')
            setTableNumber(null)
        }
    }

    const fetchMenu = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/menu')
            if (!res.ok) throw new Error()
            const data = await res.json()
            // SAFETY: Ensure every item has sizes & extras array
            const safeData = Array.isArray(data) ? data.map((item: any) => ({
                ...item,
                sizes: Array.isArray(item.sizes) ? item.sizes : [],
                extras: Array.isArray(item.extras) ? item.extras : []
            })) : []
            setMenu(safeData)
        } catch (err) {
            toast.error('Failed to load menu')
            setMenu([])
        } finally {
            setLoading(false)
        }
    }

    const categories = ['All', ...Array.from(new Set(menu.map(m => m.category || 'Uncategorized')))]

    const filteredMenu = menu
        .filter(item => selectedCategory === 'All' || item.category === selectedCategory)
        .filter(item => item.name?.toLowerCase().includes(searchQuery.toLowerCase()))

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

    const sendToKitchen = () => {
        if (cart.length === 0) return toast.error('Cart is empty!')
        setShowCustomerModal(true)
    }

    const confirmOrder = async () => {
        const fullName = title ? `${title}. ${customerName.trim()}` : (customerName.trim() || 'Guest')
        const fullPhone = phoneNumber ? `${countryCode}${phoneNumber.replace(/\D/g, '')}` : null

        // FINAL LOGIC — 100% CORRECT
        const isDineIn = !!tableId  // if tableId exists → dine-in
        const source = isDineIn ? 'dine-in' : 'takeaway'
        const tableNum = isDineIn ? tableNumber : null  // Use actual table number like "T1", "VIP-3"

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
            total: Math.round(total),
            tableNumber: tableNum,              // "T1", "VIP-3", or null
            source: source,                     // "dine-in" or "takeaway"
            customerName: fullName,
            customerPhone: fullPhone,
            notes: "",
            waiterName: "Staff"
        }

        try {
            const res = await fetch('http://localhost:8080/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) throw new Error(await res.text())

            await res.json()
            toast.success(`Order created for ${fullName}! Proceeding to payment and kitchen dispatch...`, { duration: 2000 })
            setCart([])
            setShowCustomerModal(false)

            // Navigate to payment page
            setTimeout(() => navigate('/payment'), 500)
        } catch (err: any) {
            toast.error('Failed: ' + err.message)
        }
    }

    if (loading) return <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center text-6xl text-brand">Loading...</div>

    return (
        <>
            <Toaster position="top-center" />

            {/* CUSTOMER MODAL */}
            {showCustomerModal && (
                <div className="fixed inset-0 bg-black/70 dark:bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 max-w-lg w-full border-2 border-gray-200 dark:border-slate-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-4xl font-bold text-blue-300 flex items-center gap-4">
                                <User className="w-12 h-12" /> Customer Info
                            </h2>
                            <button onClick={() => setShowCustomerModal(false)}>
                                <X className="w-10 h-10" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-xl text-gray-300">Title</label>
                                <div className="grid grid-cols-4 gap-4 mt-3">
                                    {(['Mr', 'Mrs', 'Miss', 'Dr'] as const).map(t => (
                                        <button key={t} onClick={() => setTitle(t)}
                                            className={`py-4 rounded-xl text-xl font-bold text-white ${title === t ? 'bg-cyan-600' : 'bg-white/10 hover:bg-white/20'}`}>
                                            {t}.
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <input type="text" placeholder="Name" value={customerName} onChange={e => setCustomerName(e.target.value)}
                                className="w-full px-6 py-5 rounded-xl bg-white/10 text-xl border border-white/20 focus:border-cyan-400 outline-none" />

                            <div className="flex gap-3">
                                <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                                    className="px-5 py-5 rounded-xl bg-white/10 border border-white/20">
                                    <option value="+94">+94</option>
                                    <option value="+91">+91</option>
                                    <option value="+1">+1</option>
                                </select>
                                <input type="tel" placeholder="771234567" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                                    className="flex-1 px-6 py-5 rounded-xl bg-white/10 text-xl border border-white/20 focus:border-cyan-400 outline-none" />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button onClick={() => setShowCustomerModal(false)} className="flex-1 py-5 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-bold text-xl">Cancel</button>
                            <button onClick={confirmOrder} className="flex-1 py-5 bg-brand rounded-xl font-bold text-xl shadow-xl">
                                Confirm & Go to Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                        })} className="w-14 h-14 bg-green-600 rounded-full"><Plus className="text-white" /></button>
                                        <span className="text-3xl font-bold w-16 text-center">
                                            {selectedExtras.find(e => e.extraId === extra.id)?.qty || 0}
                                        </span>
                                        <button onClick={() => setSelectedExtras(p => p.map(e => e.extraId === extra.id ? { ...e, qty: Math.max(0, e.qty - 1) } : e).filter(e => e.qty > 0))}
                                            className="w-14 h-14 bg-red-600 rounded-full"><Minus className="text-white" /></button>
                                    </div>
                                </div>
                            )) : <p className="text-center text-gray-400 text-xl">No extras</p>}
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button onClick={() => setShowExtrasModal(false)} className="flex-1 py-5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-xl font-bold text-xl">Cancel</button>
                            <button onClick={confirmAddToCart} className="flex-1 py-5 bg-brand rounded-xl font-bold text-xl">
                                Add • Rs {currentItemForExtras.size.price + selectedExtras.reduce((s, e) => s + e.price * e.qty, 0)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN PAGE */}
            <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white flex transition-colors">
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <button onClick={() => navigate('/tables')} className="flex items-center gap-3 px-6 py-4 bg-white/10 rounded-xl">
                                <ArrowLeft /> Back
                            </button>
                            {tableId && <div className="bg-brand px-12 py-6 rounded-3xl text-5xl font-bold text-white">{tableNumber || 'Table'}</div>}
                        </div>

                        <h1 className="text-4xl font-extrabold text-center mb-6 text-white">Take Order</h1>

                        <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full max-w-2xl mx-auto block px-4 py-3 rounded-2xl bg-white/10 text-lg mb-6" />

                        <div className="flex gap-4 flex-wrap justify-center mb-12">
                            {categories.map(cat => (
                                <button key={cat} onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-base font-semibold ${selectedCategory === cat ? 'bg-brand text-white' : 'bg-white/10'}`}>
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredMenu.map(item => (
                                <div key={item.id} className="bg-white/10 rounded-2xl overflow-hidden border border-purple-600 hover:border-cyan-500 hover:scale-105 transition shadow-md">
                                    {item.mediaUrl ? <img src={item.mediaUrl} alt={item.name} className="w-full h-48 object-cover" /> :
                                        <div className="h-48 bg-brand-opaque flex items-center justify-center">
                                            <Package className="w-20 h-20 text-white/30" />
                                        </div>
                                    }
                                    <div className="p-4">
                                        <h3 className="text-xl font-semibold text-blue-300 text-center mb-4">{item.name}</h3>
                                        <div className="space-y-3">
                                            {(item.sizes || []).map(size => (
                                                <button key={size.name}
                                                    onClick={() => (item.extras && item.extras.length > 0) ? openExtras(item, size) : addToCartDirect(item, size)}
                                                    className="w-full py-2 bg-brand rounded-lg font-semibold text-lg flex justify-between px-4 shadow-sm">
                                                    <span>{size.name}</span>
                                                    <span>Rs {size.price}</span>
                                                </button>
                                            ))}
                                        </div>
                                        {(item.extras && item.extras.length > 0) && <p className="text-yellow-400 text-center mt-4 font-semibold text-sm">+ Extras Available</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CART */}
                <div className="w-80 bg-white dark:bg-slate-800 border-l-2 border-gray-200 dark:border-slate-700 p-6 flex flex-col">
                    <div className="flex items-center gap-4 mb-8">
                        <ShoppingCart className="w-10 h-10 text-blue-300" />
                        <h2 className="text-2xl font-bold">Cart ({cart.reduce((s, i) => s + i.qty, 0)})</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4">
                        {cart.length === 0 ? <p className="text-center text-gray-500 text-xl py-20">Empty</p> :
                            cart.map((item, i) => (
                                <div key={i} className="bg-white/10 rounded-2xl p-4 border border-brand">
                                    <div className="flex justify-between mb-3">
                                        <div>
                                            <p className="text-lg font-semibold">{item.name}</p>
                                            <p className="text-orange-300 text-sm">{item.sizeName}</p>
                                            {item.extras.map((e, ei) => <p key={ei} className="text-yellow-400 text-sm">• {e.name} ×{e.qty}</p>)}
                                        </div>
                                        <p className="text-xl font-bold text-green-300">Rs {item.totalPrice * item.qty}</p>
                                    </div>
                                    <div className="flex justify-center items-center gap-6 mt-6">
                                        <button onClick={() => updateQty(i, -1)} className="w-12 h-12 bg-red-600 rounded-full"><Minus className="w-6 h-6" /></button>
                                        <span className="text-2xl font-extrabold text-blue-300">{item.qty}</span>
                                        <button onClick={() => updateQty(i, 1)} className="w-12 h-12 bg-green-600 rounded-full"><Plus className="w-6 h-6" /></button>
                                    </div>
                                </div>
                            ))}
                    </div>

                    <div className="border-t border-brand pt-4 mt-4">
                        <div className="flex justify-between mb-4">
                            <span className="text-lg font-bold">Total</span>
                            <span className="text-2xl font-extrabold text-green-300">Rs {total}</span>
                        </div>
                        <button onClick={sendToKitchen} disabled={cart.length === 0}
                            className="w-full py-3 bg-brand rounded-xl font-semibold text-base shadow-md disabled:opacity-50">
                            REVIEW & PAY
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default OrderEntry