import React, { useState, useEffect } from 'react'

const Payment = () => {
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('http://localhost:8080/api/orders/current/total')
            .then(res => res.json())
            .then(data => {
                setTotal(data.total)
                setLoading(false)
            })
    }, [])

    return (
        <div>
            <h1 className="text-5xl font-bold mb-10 text-black">Payment</h1>
            <div className="bg-white p-16 rounded-3xl shadow-2xl max-w-3xl mx-auto text-center">
                {loading ? (
                    <p className="text-4xl text-neutral-600">Calculating...</p>
                ) : (
                    <>
                        <p className="text-8xl font-bold text-indigo-700 mb-10">${total.toFixed(2)}</p>
                        <div className="grid grid-cols-2 gap-10">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white py-12 rounded-3xl text-4xl font-bold">
                                Card
                            </button>
                            <button className="bg-green-600 hover:bg-green-700 text-white py-12 rounded-3xl text-4xl font-bold">
                                Cash
                            </button>
                        </div>
                        <button className="w-full mt-10 bg-purple-600 hover:bg-purple-700 text-white py-10 rounded-3xl text-3xl">
                            Split Bill
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

export default Payment