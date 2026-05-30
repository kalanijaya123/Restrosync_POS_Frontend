import { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { Plus, AlertTriangle, Search, Edit2 } from 'lucide-react'
import { getApiUrl } from '../services/api'

interface InventoryItem {
    id: string
    name: string
    unit: string
    currentStock: number
    lowStockAlert: number
    category: string
}

const InventoryDashboard = () => {
    const [items, setItems] = useState<InventoryItem[]>([])
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState<InventoryItem | null>(null)
    const [form, setForm] = useState({
        name: '', unit: 'kg', lowStockAlert: 5, category: 'Vegetables'
    })

    useEffect(() => {
        fetchInventory()
    }, [])

    const fetchInventory = async () => {
        try {
            const res = await fetch(getApiUrl('/inventory'))
            const data = await res.json()
            setItems(data)
        } catch (err) {
            toast.error('Failed to load inventory')
        }
    }

    const saveItem = async () => {
        if (!form.name) return toast.error('Name required')

        const payload = {
            ...form,
            currentStock: editing ? items.find(i => i.id === editing.id)?.currentStock : 0,
            lowStockAlert: Number(form.lowStockAlert)
        }

        try {
            const method = editing ? 'PUT' : 'POST'
            const url = editing
                ? getApiUrl(`/inventory/${editing.id}`)
                : getApiUrl('/inventory')

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            toast.success(editing ? 'Updated!' : 'Ingredient Added!')
            setShowModal(false)
            setEditing(null)
            fetchInventory()
        } catch {
            toast.error('Save failed')
        }
    }

    const addStock = async (id: string) => {
        const amount = prompt('Add how much stock? (e.g., 10)')
        if (!amount || isNaN(+amount)) return

        await fetch(getApiUrl(`/inventory/${id}/add`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: parseFloat(amount) })
        })
        toast.success('Stock Added!')
        fetchInventory()
    }

    const filtered = items.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase())
    )

    const formatStock = (stock: number, unit: string) => {
        if (unit === 'piece' || unit === 'packet') {
            return Number.isInteger(stock) ? `${stock}` : `${stock}`
        }

        return Number(stock).toFixed(2)
    }

    return (
        <>
            <Toaster position="top-center" />
            <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white p-8 transition-colors">
                <div className="max-w-7xl mx-auto">

                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <div className="inline-flex items-center rounded-2xl bg-slate-900 px-6 py-3 shadow-lg">
                                <h1 className="text-5xl font-extrabold text-white">
                                    Inventory Control
                                </h1>
                            </div>
                            <p className="text-gray-400 mt-2">Owner/Manager Only</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditing(null)
                                setForm({ name: '', unit: 'kg', lowStockAlert: 5, category: 'Vegetables' })
                                setShowModal(true)
                            }}
                            className="flex items-center gap-3 px-8 py-5 bg-brand rounded-2xl font-bold text-xl shadow-2xl hover:scale-105 transition text-white"
                        >
                            <Plus className="w-8 h-8" /> Add Ingredient
                        </button>
                    </div>

                    <div className="max-w-2xl mb-10">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search ingredients..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-16 pr-6 py-3.5 bg-white/10 backdrop-blur border border-white/20 rounded-2xl text-xl focus:border-cyan-500/70 transition"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filtered.map(item => {
                            const isLow = item.currentStock <= item.lowStockAlert
                            return (
                                <div key={item.id} className={`rounded-3xl p-8 border-2 transition-all shadow-xl ${isLow ? 'bg-red-50 border-red-300 dark:bg-red-900/30 dark:border-red-500' : 'bg-gray-50 border-gray-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-3xl font-bold text-slate-800 dark:text-blue-300">{item.name}</h3>
                                            <p className="text-lg text-slate-500 dark:text-gray-400">{item.category}</p>
                                        </div>
                                        {isLow && <AlertTriangle className="w-12 h-12 text-red-400" />}
                                    </div>

                                    <div className="text-6xl font-extrabold mb-4 text-slate-900 dark:text-white">
                                        {formatStock(Number(item.currentStock), item.unit)}
                                        <span className="text-2xl text-slate-500 dark:text-gray-400"> {item.unit}</span>
                                    </div>

                                    <p className="text-orange-600 dark:text-orange-300 text-lg mb-6">
                                        Alert at: {item.lowStockAlert} {item.unit}
                                    </p>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => addStock(item.id)}
                                            className="flex-1 py-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold text-xl transition"
                                        >
                                            + Add Stock
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditing(item)
                                                setForm({
                                                    name: item.name,
                                                    unit: item.unit,
                                                    lowStockAlert: item.lowStockAlert,
                                                    category: item.category
                                                })
                                                setShowModal(true)
                                            }}
                                            className="p-4 bg-gray-200 dark:bg-slate-700 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition"
                                        >
                                            <Edit2 className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50">
                    <div className="bg-linear-to-br from-blue-200 to-purple-200 dark:from-blue-200/30 dark:to-purple-200/30 p-12 rounded-3xl border-4 border-blue-300 shadow-2xl w-full max-w-2xl">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-blue-300 text-center mb-10">
                            {editing ? 'Edit' : 'New'} Ingredient
                        </h2>
                        <div className="space-y-6">
                            <input
                                type="text"
                                placeholder="Ingredient Name"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full px-8 py-6 bg-white dark:bg-white/10 border-2 border-blue-400 dark:border-brand rounded-2xl text-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-400"
                            />
                            <div className="grid grid-cols-3 gap-6">
                                <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                                    className="px-6 py-6 bg-white dark:bg-white/10 border-2 border-blue-400 dark:border-brand rounded-2xl text-xl text-gray-900 dark:text-white focus:outline-none focus:border-purple-400">
                                    <option>kg</option><option>gram</option><option>liter</option><option>piece</option><option>packet</option>
                                </select>
                                <input type="number" placeholder="Low Alert" value={form.lowStockAlert}
                                    onChange={e => setForm({ ...form, lowStockAlert: +e.target.value })}
                                    className="px-6 py-6 bg-white dark:bg-white/10 border-2 border-blue-400 dark:border-purple-500 rounded-2xl text-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-400" />
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                    className="px-6 py-6 bg-white dark:bg-white/10 border-2 border-blue-400 dark:border-purple-500 rounded-2xl text-xl text-gray-900 dark:text-white focus:outline-none focus:border-purple-400">
                                    <option>Vegetables</option><option>Meat</option><option>Dairy</option><option>Spices</option><option>Others</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-6 mt-10">
                            <button onClick={saveItem}
                                className="flex-1 py-6 bg-green-500 hover:bg-green-600 rounded-2xl font-bold text-2xl shadow-xl hover:scale-105 transition text-white">
                                {editing ? 'UPDATE' : 'ADD'}
                            </button>
                            <button onClick={() => setShowModal(false)}
                                className="flex-1 py-6 bg-gray-500 hover:bg-gray-600 text-white rounded-2xl font-bold text-2xl transition">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </>
    )
}

export default InventoryDashboard