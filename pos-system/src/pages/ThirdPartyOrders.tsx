import React, { useState, useEffect } from 'react'

const ThirdPartyOrders = () => {
    const [orders, setOrders] = useState([])

    useEffect(() => {
        fetch('http://localhost:8080/api/thirdparty/orders')
            .then(res => res.json())
            .then(setOrders)
    }, [])

    return (
        <div>
            <h1 className="text-5xl font-bold mb-10 text-black">Third-Party Orders</h1>
            <div className="space-y-8">
                {orders.map((order: any) => (
                    <div key={order.id} className="bg-white p-10 rounded-3xl shadow-2xl flex justify-between items-center">
                        <div>
                            <p className="text-4xl font-bold">Uber Eats #{order.id}</p>
                            <p className="text-2xl text-gray-600">{order.customer}</p>
                        </div>
                        <button className="bg-green-600 hover:bg-green-700 text-white px-12 py-8 rounded-2xl text-3xl">
                            Accept
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ThirdPartyOrders