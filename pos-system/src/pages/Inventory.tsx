import React, { useState, useEffect } from 'react'

interface Item {
    name: string
    stock: number
    threshold: number
}

const Inventory = () => {
    const [items, setItems] = useState<Item[]>([])

    useEffect(() => {
        fetch('http://localhost:8080/api/inventory')
            .then(res => res.json())
            .then(setItems)
    }, [])

    return (
        <div>
            <h1 className="text-5xl font-bold mb-10 text-indigo-700">Inventory</h1>
            <div className="bg-white p-10 rounded-3xl shadow-2xl">
                {items.map((item, i) => {
                    const low = item.stock < item.threshold
                    return (
                        <div key={i} className="flex justify-between items-center py-6 border-b">
                            <div>
                                <span className="text-2xl text-gray-800 font-medium">{item.name}</span>
                                {low && (
                                    <span className="ml-3 inline-block bg-red-50 text-red-700 text-sm px-2 py-1 rounded-md font-semibold">LOW STOCK</span>
                                )}
                            </div>

                            <div className="text-2xl">
                                <span className={low ? 'text-red-600 font-bold' : 'text-green-600 font-semibold'}>{item.stock}</span>
                                <span className="ml-2 text-sm text-gray-500">/ {item.threshold}</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default Inventory