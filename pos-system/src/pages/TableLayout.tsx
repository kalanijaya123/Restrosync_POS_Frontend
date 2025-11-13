import React from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { Link } from 'react-router-dom'

const TableLayout = () => {
    const { data: tables = [] } = useQuery({
        queryKey: ['tables'],
        queryFn: () => api.get('/tables').then(res => res.data),
    })

    return (
        <div>
            <h1 className="text-5xl font-bold mb-10 text-black">Table Layout</h1>
            <div className="grid grid-cols-6 gap-10">
                {tables.map((table: any) => (
                    <Link
                        key={table.id}
                        to={`/orders/${table.id}`}
                        className={`border-8 rounded-3xl p-16 text-center shadow-2xl transition transform hover:scale-110 ${table.status === 'occupied' ? 'bg-red-100 border-red-600' : 'bg-green-100 border-green-600'
                            }`}
                    >
                        <p className="text-6xl font-bold">{table.number}</p>
                        <p className="text-xl mt-4">{table.status}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default TableLayout