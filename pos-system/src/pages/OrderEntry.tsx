import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

const OrderEntry = () => {
    const queryClient = useQueryClient()
    const [cart, setCart] = useState<any[]>([])

    const { data: menu } = useQuery({
        queryKey: ['menu'],
        queryFn: () => api.get('/menu').then(res => res.data),
    })

    const addToCart = (item: any) => {
        setCart([...cart, item])
    }

    const sendOrder = useMutation({
        mutationFn: () => api.post('/orders', { items: cart }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] })
            setCart([])
        }
    })

    return (
        <div className="min-h-screen p-8">
            <h1 className="text-4xl font-bold mb-6 text-indigo-700">Order Entry</h1>

            <div className="grid grid-cols-3 gap-8">
                {/* Menu column */}
                <div className="bg-white p-8 rounded-2xl shadow-xl overflow-auto max-h-[75vh]">
                    <h2 className="text-2xl font-bold mb-6 text-indigo-600">Menu</h2>
                    {menu?.categories.map((cat: any) => (
                        <div key={cat.id} className="mb-6">
                            <h3 className="text-xl font-semibold text-indigo-500 mb-3">{cat.name}</h3>
                            {cat.items.map((item: any) => (
                                <button
                                    key={item.id}
                                    onClick={() => addToCart(item)}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 text-base rounded-lg mb-3 text-left px-4"
                                >
                                    <div className="flex justify-between">
                                        <span className="font-medium">{item.name}</span>
                                        <span className="font-semibold text-indigo-100">${item.price}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Order summary column */}
                <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col">
                    <h2 className="text-2xl font-bold mb-6 text-indigo-600">Order Summary</h2>
                    <div className="flex-1 overflow-auto">
                        {cart.length === 0 && (
                            <p className="text-gray-500">No items in the order yet.</p>
                        )}
                        {cart.map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-3 border-b text-lg text-gray-800">
                                <span className="truncate">{item.name}</span>
                                <span className="font-semibold text-indigo-600">${item.price}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6">
                        <p className="text-2xl font-bold text-gray-900">Total: <span className="text-indigo-700">${cart.reduce((sum, i) => sum + i.price, 0)}</span></p>
                    </div>
                </div>

                {/* Actions column */}
                <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-indigo-600">Actions</h2>
                        <p className="text-gray-700 mb-4">Review the order and send it to the kitchen when ready.</p>
                    </div>

                    <div>
                        <button
                            onClick={() => sendOrder.mutate()}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-2xl rounded-xl mb-4"
                        >
                            Send to Kitchen
                        </button>

                        <button
                            onClick={() => setCart([])}
                            className="w-full bg-gray-200 hover:bg-gray-300 text-white py-3 text-lg rounded-lg"
                        >
                            Clear Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OrderEntry