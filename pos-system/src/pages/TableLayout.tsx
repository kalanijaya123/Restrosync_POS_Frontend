import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast, { Toaster } from 'react-hot-toast'
import { Plus, Edit2, Save, X, Move, Users, Lock, Unlock } from 'lucide-react'

interface Table {
    id: string
    number: string
    chairs: number
    status: 'available' | 'occupied'
    currentOrderId?: string | null
    x: number
    y: number
}

const TableLayout = () => {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const [isAdding, setIsAdding] = useState(false)
    const [editingTable, setEditingTable] = useState<Table | null>(null)
    const [newTable, setNewTable] = useState({ number: '', chairs: 4 })
    const [layout, setLayout] = useState<Table[]>([])

    const { data: tables = [], isLoading } = useQuery<Table[]>({
        queryKey: ['tables'],
        queryFn: () => api.get('/tables').then(res => res.data || []),
    })

    useEffect(() => {
        setLayout(tables)
    }, [tables])

    // Mutations
    const saveLayout = useMutation({
        mutationFn: (updatedTables: Table[]) =>
            api.put('/tables/layout', { tables: updatedTables.map(t => ({ id: t.id, x: t.x, y: t.y })) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] })
            toast.success('Layout saved!')
        },
    })

    const reserveTable = useMutation({
        mutationFn: (tableId: string) =>
            api.put(`/tables/${tableId}/occupy`, { orderId: 'pending' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] })
    })

    const clearTable = useMutation({
        mutationFn: (tableId: string) => api.put(`/tables/${tableId}/clear`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] })
            toast.success('Table freed!')
        }
    })

    const deleteTable = useMutation({
        mutationFn: (id: string) => api.delete(`/tables/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] })
            toast.success('Table deleted')
        }
    })

    const addTable = async () => {
        if (!newTable.number.trim()) return toast.error('Enter table number')

        try {
            await api.post('/tables', {
                number: newTable.number,
                chairs: newTable.chairs,
                x: Math.random() * 70 + 15,
                y: Math.random() * 60 + 20,
            })
            queryClient.invalidateQueries({ queryKey: ['tables'] })
            setNewTable({ number: '', chairs: 4 })
            setIsAdding(false)
            toast.success(`Table ${newTable.number} added!`)
        } catch {
            toast.error('Failed to add table')
        }
    }

    const handleTableClick = async (table: Table) => {
        if (table.status === 'occupied') {
            if (confirm(`Free Table ${table.number}?`)) {
                clearTable.mutate(table.id)
            }
            return
        }

        try {
            await reserveTable.mutateAsync(table.id)
            toast.success(`Table ${table.number} reserved!`)
            navigate(`/orders/${table.id}`)
        } catch {
            toast.error('Failed to reserve table')
        }
    }

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('tableId', id)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const tableId = e.dataTransfer.getData('tableId')
        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        setLayout(prev =>
            prev.map(t =>
                t.id === tableId
                    ? { ...t, x: Math.max(5, Math.min(90, x)), y: Math.max(5, Math.min(85, y)) }
                    : t
            )
        )
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-950 to-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-pink-500 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <>
            <Toaster position="top-center" />

            <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-black text-white p-8">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
                            Restaurant Floor Plan
                        </h1>
                        <p className="text-purple-300 mt-3 text-lg">
                            Green = Available | Red = Reserved (Click to Free) | Drag to Move
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-xl font-bold text-xl shadow-2xl hover:scale-105 transition"
                        >
                            <Plus className="w-7 h-7" /> Add Table
                        </button>
                        <button
                            onClick={() => saveLayout.mutate(layout)}
                            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-xl shadow-2xl hover:scale-105 transition"
                        >
                            <Save className="w-7 h-7" /> Save Layout
                        </button>
                    </div>
                </div>

                <div
                    className="relative bg-black/40 backdrop-blur-xl rounded-3xl border-4 border-purple-700/50 shadow-2xl overflow-hidden h-[80vh]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    <div className="absolute inset-0 opacity-10">
                        <div className="grid grid-cols-12 grid-rows-12 h-full">
                            {Array.from({ length: 144 }).map((_, i) => (
                                <div key={i} className="border border-purple-600/30"></div>
                            ))}
                        </div>
                    </div>

                    {layout.map((table) => (
                        <div
                            key={table.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, table.id)}
                            style={{
                                position: 'absolute',
                                left: `${table.x}%`,
                                top: `${table.y}%`,
                                transform: 'translate(-50%, -50%)',
                            }}
                            className="group"
                        >
                            <div
                                onClick={() => handleTableClick(table)}
                                className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all transform hover:scale-110 cursor-pointer
                                    ${table.status === 'occupied'
                                        ? 'bg-gradient-to-br from-red-600 to-pink-700 border-8 border-red-500/70'
                                        : 'bg-gradient-to-br from-emerald-600 to-cyan-600 border-8 border-emerald-500/70'
                                    }`}
                            >
                                {table.status === 'occupied' ? (
                                    <Lock className="absolute top-4 right-4 w-9 h-9 text-white/90" />
                                ) : (
                                    <Unlock className="absolute top-4 right-4 w-7 h-7 text-white/60 opacity-0 group-hover:opacity-100 transition" />
                                )}
                                <Move className="absolute top-4 left-4 w-7 h-7 text-white/70 opacity-0 group-hover:opacity-100 transition" />

                                <p className="text-5xl font-extrabold text-white drop-shadow-2xl">
                                    {table.number}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Users className="w-7 h-7" />
                                    <span className="text-2xl font-bold">{table.chairs}</span>
                                </div>
                                <p className="text-sm font-semibold mt-2">
                                    {table.status === 'occupied' ? 'RESERVED' : 'FREE'}
                                </p>

                                <div
                                    className="absolute -top-5 -right-5 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => setEditingTable(table)}
                                        className="bg-purple-600 p-3.5 rounded-full shadow-2xl hover:bg-purple-500"
                                    >
                                        <Edit2 className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={() => confirm(`Delete ${table.number}?`) && deleteTable.mutate(table.id)}
                                        className="bg-red-600 p-3.5 rounded-full shadow-2xl hover:bg-red-500"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {layout.length === 0 && (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-4xl text-purple-400 font-bold">Click "Add Table" to begin</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ADD / EDIT MODAL */}
            {(isAdding || editingTable) && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50">
                    <div className="bg-gradient-to-br from-purple-900 to-black p-10 rounded-3xl shadow-2xl border border-purple-600 w-96">
                        <h2 className="text-3xl font-bold text-cyan-300 mb-8 text-center">
                            {editingTable ? 'Edit Table' : 'Add New Table'}
                        </h2>
                        <input
                            type="text"
                            placeholder="Table Number (e.g. T1, VIP-3)"
                            value={editingTable ? editingTable.number : newTable.number}
                            onChange={(e) =>
                                editingTable
                                    ? setEditingTable({ ...editingTable, number: e.target.value })
                                    : setNewTable({ ...newTable, number: e.target.value })
                            }
                            className="w-full px-6 py-5 bg-white/10 border border-purple-500 rounded-xl text-xl mb-6 placeholder-purple-400"
                        />
                        <select
                            value={editingTable ? editingTable.chairs : newTable.chairs}
                            onChange={(e) =>
                                editingTable
                                    ? setEditingTable({ ...editingTable, chairs: Number(e.target.value) })
                                    : setNewTable({ ...newTable, chairs: Number(e.target.value) })
                            }
                            className="w-full px-6 py-5 bg-white/10 border border-purple-500 rounded-xl text-xl"
                        >
                            {[2, 4, 6, 8, 10, 12].map(n => (
                                <option key={n} value={n}>{n} Seats</option>
                            ))}
                        </select>

                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={async () => {
                                    if (editingTable) {
                                        await api.put(`/tables/${editingTable.id}`, editingTable)
                                        queryClient.invalidateQueries({ queryKey: ['tables'] })
                                        toast.success('Table updated!')
                                        setEditingTable(null)
                                    } else {
                                        addTable()
                                    }
                                }}
                                className="flex-1 py-5 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-xl font-bold text-xl shadow-xl hover:scale-105 transition"
                            >
                                {editingTable ? 'Update' : 'Add'} Table
                            </button>
                            <button
                                onClick={() => {
                                    setIsAdding(false)
                                    setEditingTable(null)
                                }}
                                className="flex-1 py-5 bg-gray-700 rounded-xl font-bold text-xl shadow-xl hover:bg-gray-600 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default TableLayout