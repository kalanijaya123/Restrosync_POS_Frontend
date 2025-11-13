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
            <h1 className="text-5xl font-bold mb-10 text-black">Inventory</h1>
            <div className="bg-white p-10 rounded-3xl shadow-2xl">
                {items.map((item, i) => (
                    <div key={i} className={`flex justify-between items-center py-8 border-b text-2xl ${item.stock < item.threshold ? 'text-red-600 font-bold' : ''}`}>
                        <span>{item.name}</span>
                        <span>{item.stock} {item.stock < item.threshold && '→ LOW STOCK!'}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Inventory