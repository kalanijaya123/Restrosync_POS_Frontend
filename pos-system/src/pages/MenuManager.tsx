import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Plus, Trash2, Check, X, ChefHat, Camera, Image as ImageIcon, Loader2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Size {
    name: string
    price: number
}

interface MenuItem {
    id: string
    name: string
    category: string
    price?: number
    sizes?: Size[]
    available: boolean
    imageUrl?: string
}

const MenuManager = () => {
    const [menu, setMenu] = useState<MenuItem[]>([])
    const [categories, setCategories] = useState<string[]>([
        'Starters', 'Mains', 'Biryani', 'Chinese', 'Desserts', 'Beverages', 'Pizza', 'Burgers'
    ])
    const [newCategory, setNewCategory] = useState('')

    const [form, setForm] = useState({ name: '', category: 'Mains' })
    const [sizes, setSizes] = useState<Size[]>([
        { name: 'Small', price: 0 },
        { name: 'Medium', price: 0 },
        { name: 'Large', price: 0 }
    ])
    const [customSizeName, setCustomSizeName] = useState('')
    const [customSizePrice, setCustomSizePrice] = useState('')
    const [mediaFile, setMediaFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    useEffect(() => { fetchMenu() }, [])

    const fetchMenu = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/menu')
            if (!res.ok) throw new Error()
            const data = await res.json()
            setMenu(Array.isArray(data) ? data : [])

            // Extract unique categories from menu items
            const menuCategories = [...new Set(data.map((item: MenuItem) => item.category))] as string[]
            setCategories(prev => {
                const merged = [...prev, ...menuCategories.filter(c => !prev.includes(c))]
                merged.sort()
                return merged
            })
        } catch {
            toast.error('Failed to load menu')
        }
    }

    const addNewCategory = () => {
        if (!newCategory.trim()) return toast.error('Enter category name')
        const cleaned = newCategory.trim()
        if (categories.includes(cleaned)) return toast.error('Category already exists')
        setCategories(prev => {
            const merged = [...prev, cleaned]
            merged.sort()
            return merged
        })
        setForm({ ...form, category: cleaned })
        setNewCategory('')
        toast.success(`Category "${cleaned}" added!`)
        toast.success(`Category "${cleaned}" added!`)
    }

    const addCustomSize = () => {
        if (!customSizeName.trim()) return toast.error('Enter size name')
        if (!customSizePrice || Number(customSizePrice) <= 0) return toast.error('Enter valid price')

        setSizes([...sizes, { name: customSizeName.trim(), price: Number(customSizePrice) }])
        setCustomSizeName('')
        setCustomSizePrice('')
        toast.success(`Added: ${customSizeName}`)
    }

    const removeSize = (index: number) => {
        setSizes(sizes.filter((_, i) => i !== index))
    }

    const updateSizePrice = (index: number, price: string) => {
        const updated = [...sizes]
        updated[index].price = price ? Number(price) : 0
        setSizes(updated)
    }

    const handleAddItem = async () => {
        if (!form.name.trim()) return toast.error('Enter item name')
        const validSizes = sizes.filter(s => s.price > 0)
        if (validSizes.length === 0) return toast.error('Add at least one price')

        setUploading(true)
        const formData = new FormData()
        formData.append('name', form.name)
        formData.append('category', form.category)
        formData.append('sizes', JSON.stringify(validSizes))
        if (mediaFile) formData.append('media', mediaFile)

        try {
            const res = await fetch('http://localhost:8080/api/menu', {
                method: 'POST',
                body: formData
            })

            if (!res.ok) throw new Error(await res.text())

            toast.success('Item added successfully!')
            resetForm()
            await fetchMenu()
        } catch (err: any) {
            toast.error(err.message || 'Failed to add item')
        } finally {
            setUploading(false)
        }
    }

    const resetForm = () => {
        setForm({ name: '', category: categories[0] || 'Mains' })
        setSizes([
            { name: 'Small', price: 0 },
            { name: 'Medium', price: 0 },
            { name: 'Large', price: 0 }
        ])
        setCustomSizeName('')
        setCustomSizePrice('')
        setMediaFile(null)
        if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this item permanently?')) return
        try {
            await fetch(`http://localhost:8080/api/menu/${id}`, { method: 'DELETE' })
            toast.success('Item deleted')
            fetchMenu()
        } catch { toast.error('Delete failed') }
    }

    const toggleAvailability = async (id: string, current: boolean) => {
        try {
            await fetch(`http://localhost:8080/api/menu/${id}/toggle`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ available: !current })
            })
            toast.success(current ? 'Marked as Sold Out' : 'Now Available')
            fetchMenu()
        } catch { toast.error('Update failed') }
    }

    return (
        <>
            <Toaster position="top-center" />

            <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-black text-white p-6">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center items-center gap-4 mb-4">
                        <ChefHat className="w-12 h-12 text-orange-400" />
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
                            Menu Manager
                        </h1>
                        <ChefHat className="w-12 h-12 text-pink-400" />
                    </div>
                    <p className="text-lg text-gray-300">Manage your restaurant menu with multiple sizes & categories</p>
                </div>

                {/* Add Form */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="max-w-6xl mx-auto bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 mb-12 border border-white/20"
                >
                    <h2 className="text-3xl font-bold text-center mb-8 text-cyan-300">Add New Menu Item</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-200">Dish Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Chicken Biryani"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-5 py-4 rounded-xl bg-white/20 border border-white/30 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none text-lg"
                                />
                            </div>

                            {/* CATEGORY SELECTOR + ADD NEW */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-200">Category</label>
                                <div className="flex gap-3">
                                    <select
                                        value={form.category}
                                        onChange={e => setForm({ ...form, category: e.target.value })}
                                        className="flex-1 px-5 py-4 rounded-xl bg-white/20 border border-white/30 text-white focus:border-cyan-400 text-lg"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <input
                                        type="text"
                                        placeholder="Add new category..."
                                        value={newCategory}
                                        onChange={e => setNewCategory(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addNewCategory()}
                                        className="flex-1 px-5 py-4 rounded-xl bg-white/20 border border-white/30 placeholder-gray-400 focus:border-pink-500 focus:outline-none text-lg"
                                    />
                                    <button
                                        onClick={addNewCategory}
                                        className="px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-xl font-bold transition transform hover:scale-105 shadow-lg"
                                    >
                                        <Plus className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Sizes */}
                            <div>
                                <label className="block text-sm font-medium mb-4 text-cyan-300">Sizes & Prices</label>
                                <div className="space-y-3">
                                    {sizes.map((size, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="flex-1 bg-white/10 rounded-lg px-5 py-4 border border-white/20">
                                                <span className="font-medium text-lg">{size.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-green-400 font-bold">Rs</span>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={size.price || ''}
                                                    onChange={e => updateSizePrice(index, e.target.value)}
                                                    className="w-32 px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white text-lg"
                                                    min="0"
                                                />
                                            </div>
                                            {index >= 3 && (
                                                <button onClick={() => removeSize(index)} className="p-3 bg-red-600 hover:bg-red-700 rounded-lg transition">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <input
                                        type="text"
                                        placeholder="e.g. Family Pack"
                                        value={customSizeName}
                                        onChange={e => setCustomSizeName(e.target.value)}
                                        className="flex-1 px-5 py-4 rounded-xl bg-white/20 border border-white/30 placeholder-gray-400 text-lg"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Price"
                                        value={customSizePrice}
                                        onChange={e => setCustomSizePrice(e.target.value)}
                                        className="w-32 px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-lg"
                                    />
                                    <button onClick={addCustomSize} className="px-6 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:scale-105 rounded-xl font-bold transition shadow-lg">
                                        Add Size
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-200">Food Photo</label>
                            <label className="block cursor-pointer">
                                <div className="border-2 border-dashed border-white/40 rounded-2xl p-8 text-center hover:border-cyan-400 transition h-96 flex flex-col items-center justify-center bg-white/5">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl" />
                                    ) : (
                                        <>
                                            <Camera className="w-16 h-16 text-gray-400 mb-4" />
                                            <p className="text-xl text-gray-300">Click to upload image</p>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => {
                                        const file = e.target.files?.[0]
                                        setMediaFile(file || null)
                                        if (file) setPreviewUrl(URL.createObjectURL(file))
                                    }}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="text-center mt-10">
                        <button
                            onClick={handleAddItem}
                            disabled={uploading}
                            className="px-16 py-6 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-bold text-2xl rounded-full shadow-2xl transform hover:scale-105 transition disabled:opacity-60"
                        >
                            {uploading ? 'Adding Item...' : 'ADD ITEM WITH SIZES'}
                        </button>
                    </div>
                </motion.div>

                {/* Menu Grid */}
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-10 text-cyan-300">
                        Current Menu ({menu.length} items)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        <AnimatePresence>
                            {menu.map(item => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    whileHover={{ y: -10 }}
                                    className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 hover:border-purple-500/50 transition-all"
                                >
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-64 object-cover" />
                                    ) : (
                                        <div className="h-64 bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
                                            <ImageIcon className="w-20 h-20 text-white/30" />
                                        </div>
                                    )}

                                    <div className="p-6">
                                        <h3 className="text-2xl font-bold mb-2 text-cyan-300">{item.name}</h3>
                                        <p className="text-purple-300 mb-4 text-lg">{item.category}</p>

                                        {item.sizes && item.sizes.length > 0 ? (
                                            <div className="space-y-2 mb-6">
                                                {item.sizes.map((size, i) => (
                                                    <div key={i} className="flex justify-between items-center bg-white/10 rounded-lg px-4 py-3">
                                                        <span className="font-medium">{size.name}</span>
                                                        <span className="text-xl font-bold text-green-400">
                                                            Rs {Number(size.price).toFixed(0)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="mb-6">
                                                <span className="text-3xl font-bold text-green-400">
                                                    Rs {Number(item.price || 0).toFixed(0)}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => toggleAvailability(item.id, item.available)}
                                                className={`flex-1 py-3 rounded-lg font-bold transition ${item.available
                                                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700'
                                                    : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700'
                                                    }`}
                                            >
                                                {item.available ? 'Available' : 'Sold Out'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-3 bg-red-600 hover:bg-red-700 rounded-lg transition"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </>
    )
}

export default MenuManager