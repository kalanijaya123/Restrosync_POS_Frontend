import React, { useState, useEffect } from 'react'

interface MenuItem {
    id: string
    name: string
    price: number
    category: string
}

interface CartItem {
    item: MenuItem
    qty: number
}

const OrderEntry = () => {
    const [menu, setMenu] = useState<MenuItem[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [selectedCategory, setSelectedCategory] = useState('All')

    useEffect(() => {
        fetch('http://localhost:8080/api/menu')
            .then(r => r.ok ? r.json() : [])
            .then(data => setMenu(Array.isArray(data) ? data : []))
    }, [])

    const categories = ['All', ...Array.from(new Set(menu.map(m => m.category)))]

    const filteredMenu = selectedCategory === 'All'
        ? menu
        : menu.filter(m => m.category === selectedCategory)

    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(c => c.item.id === item.id)
            if (existing) {
                return prev.map(c =>
                    c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c
                )
            }
            return [...prev, { item, qty: 1 }]
        })
    }

    const increment = (itemId: string) => {
        setCart(prev => prev.map(c => c.item.id === itemId ? { ...c, qty: c.qty + 1 } : c))
    }

    const decrement = (itemId: string) => {
        setCart(prev => prev.flatMap(c => {
            if (c.item.id !== itemId) return c
            if (c.qty > 1) return { ...c, qty: c.qty - 1 }
            return [] // remove when qty would go to 0
        }))
    }

    const removeItem = (itemId: string) => {
        setCart(prev => prev.filter(c => c.item.id !== itemId))
    }

    const total = cart.reduce((sum, c) => sum + c.item.price * c.qty, 0)

    // Send current cart to backend kitchen/orders endpoint
    const sendToKitchen = async () => {
        if (cart.length === 0) {
            alert('Cart is empty')
            return
        }

        // Build payloads. Try compact first (ids + qty), then verbose if that fails.
        const compactPayload = {
            tableId: 1,
            items: cart.map(c => ({ menuItemId: c.item.id, name: c.item.name, price: c.item.price, qty: c.qty })),
            total
        }

        const verbosePayload = {
            tableId: 1,
            items: cart.map(c => ({ id: c.item.id, name: c.item.name, price: c.item.price, qty: c.qty })),
            total,
            createdAt: new Date().toISOString()
        }

        const token = localStorage.getItem('authToken')

        const post = async (body: object) => {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            if (token) headers['Authorization'] = `Bearer ${token}`

            const res = await fetch('http://localhost:8080/api/orders', {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            })
            return res
        }

        try {
            console.log('Sending compact payload to /api/orders', compactPayload)
            let res = await post(compactPayload)

            // If compact was rejected, try verbose payload as a fallback
            if (!res.ok) {
                const text = await res.text()
                console.warn('Compact payload rejected:', res.status, text)
                console.log('Attempting verbose payload...')
                res = await post(verbosePayload)
            }

            // Read response body (try JSON then text)
            const contentType = res.headers.get('content-type') || ''
            const bodyText = contentType.includes('application/json') ? await res.json().catch(() => null) : await res.text().catch(() => null)

            if (!res.ok) {
                console.error('Order API returned error', res.status, bodyText)
                // If server included useful JSON, show it
                const serverMsg = typeof bodyText === 'object' ? JSON.stringify(bodyText) : String(bodyText)
                throw new Error(serverMsg || `HTTP ${res.status}`)
            }

            // success
            setCart([])
            alert('Order sent to kitchen')
        } catch (err: any) {
            console.error('Failed to send order', err)
            const message = err.message || String(err)
            alert('Failed to send order to kitchen: ' + message)
        }
    }

    return (
        <div className="flex h-screen">
            {/* LEFT: MENU */}
            <div className="w-3/4 bg-gray-50 p-8 overflow-y-auto">
                <h1 className="text-5xl font-bold mb-8 text-black"> Add Order</h1>

                {/* CATEGORY TABS */}
                <div className="flex gap-4 mb-8 flex-wrap">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-8 py-4 rounded-xl text-xl font-bold transition ${selectedCategory === cat
                                ? 'bg-teal-600 text-white shadow-lg'
                                : 'bg-white hover:bg-gray-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* MENU GRID */}
                <div className="grid grid-cols-4 gap-6">
                    {filteredMenu.map(item => (
                        <button
                            key={item.id}
                            onClick={() => addToCart(item)}
                            className="bg-teal-600 p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-left"
                        >
                            <h3 className="text-2xl font-bold text-white">{item.name}</h3>
                            <p className="text-3xl font-bold text-amber-100 mt-4">${item.price}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT: CART */}
            <div className="w-1/4 bg-white shadow-2xl p-8 flex flex-col">
                <h2 className="text-4xl font-bold mb-6 text-teal-700">Order Summary</h2>
                <div className="flex-1 overflow-y-auto">
                    {cart.length === 0 ? (
                        <p className="text-center text-gray-500 text-xl mt-20">No items yet</p>
                    ) : (
                        cart.map((c) => (
                            <div key={c.item.id} className="flex justify-between py-4 border-b text-xl items-center">
                                <div>
                                    <div className="text-gray-800">{c.qty} × <span className="font-medium">{c.item.name}</span></div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <button onClick={() => decrement(c.item.id)} className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200">-</button>
                                        <button onClick={() => increment(c.item.id)} className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200">+</button>
                                        <button onClick={() => removeItem(c.item.id)} className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200">Delete</button>
                                    </div>
                                </div>
                                <span className="font-semibold text-amber-600">${(c.item.price * c.qty).toFixed(2)}</span>
                            </div>
                        ))
                    )}
                </div>
                <div className="border-t-4 border-teal-600 pt-6">
                    <div className="flex justify-between text-4xl font-bold mb-8">
                        <span>Total</span>
                        <span className="text-teal-700">${total.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={sendToKitchen}
                        disabled={cart.length === 0}
                        className={`w-full py-8 rounded-2xl text-3xl font-bold shadow-2xl transition ${cart.length === 0 ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                    >
                        SEND TO KITCHEN
                    </button>
                </div>
            </div>
        </div>
    )
}

export default OrderEntry