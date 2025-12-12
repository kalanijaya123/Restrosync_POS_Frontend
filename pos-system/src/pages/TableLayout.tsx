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
    reservedSeats?: number
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
        const reservedSeats = table.reservedSeats || 0

        // If table has reserved seats, show info toast and ask to free or reserve
        if (reservedSeats > 0) {
            toast((t) => (
                <div className="flex flex-col gap-3">
                    <p className="font-bold text-lg">Table {table.number}</p>
                    <p>{reservedSeats} seat(s) currently reserved</p>
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => {
                                toast.dismiss(t.id)
                                handleFreeSeat(table, reservedSeats)
                            }}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
                        >
                            Free Seats
                        </button>
                        <button
                            onClick={() => {
                                toast.dismiss(t.id)
                                handleReserveSeat(table, reservedSeats)
                            }}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
                        >
                            Reserve More
                        </button>
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ), { duration: 10000 })
            return
        }

        // If no reserved seats, directly reserve
        handleReserveSeat(table, 0)
    }

    const handleFreeSeat = async (table: Table, reservedSeats: number) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="font-bold">Free seats from Table {table.number}</p>
                <p className="text-sm text-gray-600">Currently reserved: {reservedSeats}</p>
                <input
                    id={`free-input-${table.id}`}
                    type="number"
                    min="1"
                    max={reservedSeats}
                    placeholder="Number of seats"
                    className="px-3 py-2 border rounded-lg"
                />
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            const input = document.getElementById(`free-input-${table.id}`) as HTMLInputElement
                            const numSeats = parseInt(input?.value || '0')

                            if (isNaN(numSeats) || numSeats <= 0) {
                                toast.error('Please enter a valid number')
                                return
                            }

                            if (numSeats > reservedSeats) {
                                toast.error(`Only ${reservedSeats} seat(s) are reserved!`)
                                return
                            }

                            try {
                                await api.put(`/tables/${table.id}/free`, { seatsToFree: numSeats })
                                queryClient.invalidateQueries({ queryKey: ['tables'] })
                                toast.success(`${numSeats} seat(s) freed on Table ${table.number}!`)
                                toast.dismiss(t.id)
                            } catch (error) {
                                toast.error('Failed to free seats')
                            }
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
                    >
                        Confirm
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 15000 })
    }

    const handleReserveSeat = async (table: Table, reservedSeats: number) => {
        const availableSeats = table.chairs - reservedSeats

        if (availableSeats === 0) {
            toast.error('Table is fully reserved!')
            return
        }

        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="font-bold">Reserve seats for Table {table.number}</p>
                <p className="text-sm text-gray-600">Available: {availableSeats} seat(s)</p>
                <input
                    id={`reserve-input-${table.id}`}
                    type="number"
                    min="1"
                    max={availableSeats}
                    placeholder="Number of seats"
                    className="px-3 py-2 border rounded-lg"
                />
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            const input = document.getElementById(`reserve-input-${table.id}`) as HTMLInputElement
                            const numSeats = parseInt(input?.value || '0')

                            if (isNaN(numSeats) || numSeats <= 0) {
                                toast.error('Please enter a valid number')
                                return
                            }

                            if (numSeats > availableSeats) {
                                toast.error(`Only ${availableSeats} seats available!`)
                                return
                            }

                            try {
                                await api.put(`/tables/${table.id}/reserve`, { seatsToReserve: numSeats })
                                queryClient.invalidateQueries({ queryKey: ['tables'] })
                                toast.success(`${numSeats} seat(s) reserved on Table ${table.number}!`)
                                toast.dismiss(t.id)
                                navigate(`/orders/${table.id}`)
                            } catch (error) {
                                toast.error('Failed to reserve seats')
                            }
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
                    >
                        Confirm
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 15000 })
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
            <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-brand border-t-transparent"></div>
            </div>
        )
    }

    return (
        <>
            <Toaster position="top-center" />

            <div className="text-gray-900 dark:text-white p-8 transition-colors">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white">
                            Restaurant Floor Plan
                        </h1>
                        <p className="text-brand mt-3 text-lg">
                            Green = Available | Orange = Partially Reserved | Red = Fully Reserved | Click to Reserve/Free
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex items-center gap-3 px-8 py-4 bg-brand rounded-xl font-bold text-xl shadow-2xl hover:scale-105 transition text-white"
                        >
                            <Plus className="w-7 h-7" /> Add Table
                        </button>
                        <button
                            onClick={() => saveLayout.mutate(layout)}
                            className="flex items-center gap-3 px-8 py-4 bg-brand rounded-xl font-bold text-xl shadow-2xl hover:scale-105 transition text-white"
                        >
                            <Save className="w-7 h-7" /> Save Layout
                        </button>
                    </div>
                </div>

                <div
                    className="relative bg-gray-50 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl border-2 border-gray-200 dark:border-slate-600 shadow-xl overflow-hidden h-[80vh]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    <div className="absolute inset-0 opacity-5 dark:opacity-10">
                        <div className="grid grid-cols-12 grid-rows-12 h-full">
                            {Array.from({ length: 144 }).map((_, i) => (
                                <div key={i} className="border border-gray-300 dark:border-brand/30"></div>
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
                                    ${(table.reservedSeats || 0) >= table.chairs
                                        ? 'bg-red-600 border-8 border-red-500/70'
                                        : (table.reservedSeats || 0) > 0
                                            ? 'bg-orange-500 border-8 border-orange-400/70'
                                            : 'bg-emerald-600 border-8 border-emerald-500/70'
                                    }`}
                            >
                                {(table.reservedSeats || 0) >= table.chairs ? (
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
                                    <span className="text-2xl font-bold">{table.chairs - (table.reservedSeats || 0)}/{table.chairs}</span>
                                </div>
                                <p className="text-sm font-semibold mt-2">
                                    {(table.reservedSeats || 0) >= table.chairs
                                        ? 'FULLY RESERVED'
                                        : (table.reservedSeats || 0) > 0
                                            ? `${table.chairs - (table.reservedSeats || 0)} SEATS LEFT`
                                            : 'AVAILABLE'}
                                </p>

                                <div
                                    className="absolute -top-5 -right-5 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => setEditingTable(table)}
                                        className="bg-brand p-3.5 rounded-full shadow-2xl hover:bg-brand"
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
                            <p className="text-4xl text-gray-400 dark:text-brand font-bold">Click "Add Table" to begin</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ADD / EDIT MODAL */}
            {(isAdding || editingTable) && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-2xl border-2 border-gray-200 dark:border-slate-700 w-96">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
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
                            className="w-full px-6 py-5 bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 rounded-xl text-xl mb-6 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-brand focus:outline-none"
                        />
                        <select
                            value={editingTable ? editingTable.chairs : newTable.chairs}
                            onChange={(e) =>
                                editingTable
                                    ? setEditingTable({ ...editingTable, chairs: Number(e.target.value) })
                                    : setNewTable({ ...newTable, chairs: Number(e.target.value) })
                            }
                            className="w-full px-6 py-5 bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 rounded-xl text-xl text-gray-900 dark:text-white focus:border-brand focus:outline-none"
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
                                className="flex-1 py-5 bg-brand rounded-xl font-bold text-xl shadow-xl hover:scale-105 transition text-white"
                            >
                                {editingTable ? 'Update' : 'Add'} Table
                            </button>
                            <button
                                onClick={() => {
                                    setIsAdding(false)
                                    setEditingTable(null)
                                }}
                                className="flex-1 py-5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-xl font-bold text-xl shadow-xl transition"
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