// MenuManager.tsx – FINAL PRO VERSION (WORKS 100% WITH YOUR BACKEND)
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, Plus, Trash2, X, Camera, Loader2, Package } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Size {
    name: string
    price: number
}

interface RecipeItem {
    ingredientId: string
    ingredientName: string
    quantities: Record<string, number>
}

interface ExtraItem {
    id: string
    name: string
    price: number
    quantityPerUnit: number
    ingredientId: string
}

interface InventoryItem {
    id: string
    name: string
    unit: string
}

interface MenuItem {
    id: string
    name: string
    category: string
    sizes: Size[]
    available: boolean
    mediaUrl?: string
    recipe: RecipeItem[]
    extras: ExtraItem[]
}

const MenuManager = () => {
    const [menu, setMenu] = useState<MenuItem[]>([])
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [categories, setCategories] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    // Form
    const [name, setName] = useState('')
    const [category, setCategory] = useState('')
    const [newCategory, setNewCategory] = useState('')
    const [sizes, setSizes] = useState<Size[]>([
        { name: 'Small', price: 0 },
        { name: 'Regular', price: 0 },
        { name: 'Large', price: 0 }
    ])
    const [recipe, setRecipe] = useState<RecipeItem[]>([])
    const [extras, setExtras] = useState<ExtraItem[]>([])
    const [mediaFile, setMediaFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    // Temp for adding recipe/extra
    const [newIngredientId, setNewIngredientId] = useState('')
    const [newIngredientQtys, setNewIngredientQtys] = useState<Record<string, number>>({})
    const [newExtraName, setNewExtraName] = useState('')
    const [newExtraPrice, setNewExtraPrice] = useState('')
    const [newExtraQty, setNewExtraQty] = useState('')
    const [newExtraIngredientId, setNewExtraIngredientId] = useState('')

    // Keep new qtys in sync when sizes change
    useEffect(() => {
        setNewIngredientQtys(prev => {
            const next: Record<string, number> = {}
            sizes.forEach(s => next[s.name] = prev[s.name] ?? 0)
            return next
        })
    }, [sizes])

    useEffect(() => {
        fetchAllData()
    }, [])

    const fetchAllData = async () => {
        try {
            const [menuRes, invRes] = await Promise.all([
                fetch('http://localhost:8080/api/menu'),
                fetch('http://localhost:8080/api/inventory')
            ])

            const menuData: MenuItem[] = await menuRes.json()
            const invData: InventoryItem[] = await invRes.json()

            setMenu(menuData || [])
            setInventory(invData || [])

            const cats: string[] = [...new Set(menuData.map((m: MenuItem) => m.category))].sort()
            setCategories(cats.length > 0 ? cats : ['Starters', 'Mains', 'Kottu', 'Rice', 'Beverages'])
            if (cats.length > 0) setCategory(cats[0])

        } catch (err) {
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const addRecipeItem = () => {
        if (!newIngredientId) return toast.error('Select ingredient')
        const ing = inventory.find(i => i.id === newIngredientId)
        if (!ing) return toast.error('Invalid ingredient')

        const quantities: Record<string, number> = {}
        let hasQty = false
        sizes.forEach(s => {
            const v = Number(newIngredientQtys[s.name] ?? 0)
            quantities[s.name] = v
            if (v > 0) hasQty = true
        })
        if (!hasQty) return toast.error('Enter quantity for at least one size')

        setRecipe([...recipe, {
            ingredientId: newIngredientId,
            ingredientName: ing.name,
            quantities
        }])

        setNewIngredientId('')
        setNewIngredientQtys(sizes.reduce((acc, s) => ({ ...acc, [s.name]: 0 }), {}))
        toast.success(`${ing.name} added to recipe`)
    }

    const addExtra = () => {
        if (!newExtraName || !newExtraPrice || !newExtraQty || !newExtraIngredientId)
            return toast.error('Fill all extra fields')

        const ing = inventory.find(i => i.id === newExtraIngredientId)
        if (!ing) return toast.error('Invalid ingredient')

        setExtras([...extras, {
            id: 'extra-' + Date.now(),
            name: newExtraName.trim(),
            price: Number(newExtraPrice),
            quantityPerUnit: Number(newExtraQty),
            ingredientId: newExtraIngredientId
        }])

        setNewExtraName('')
        setNewExtraPrice('')
        setNewExtraQty('')
        setNewExtraIngredientId('')
        toast.success(`Extra "${newExtraName}" added`)
    }

    // FINAL WORKING SUBMIT
    const handleSubmit = async () => {
        if (!name.trim()) return toast.error('Enter dish name')
        if (!category) return toast.error('Select category')
        if (sizes.every(s => s.price <= 0)) return toast.error('Set at least one price')

        setUploading(true)

        const formData = new FormData()
        formData.append('name', name.trim())
        formData.append('category', category)
        formData.append('sizes', JSON.stringify(sizes.filter(s => s.price > 0)))
        formData.append('recipe', JSON.stringify(recipe))
        formData.append('extras', JSON.stringify(extras))
        if (mediaFile) formData.append('media', mediaFile)

        try {
            const res = await fetch('http://localhost:8080/api/menu', {
                method: 'POST',
                body: formData
            })

            if (!res.ok) {
                const err = await res.text()
                throw new Error(err || 'Save failed')
            }

            toast.success('MENU ITEM ADDED SUCCESSFULLY!', { duration: 4000, icon: 'Fire' })
            resetForm()
            fetchAllData()
        } catch (err: any) {
            toast.error(err.message || 'Failed to save')
        } finally {
            setUploading(false)
        }
    }

    const resetForm = () => {
        setName('')
        setSizes([{ name: 'Small', price: 0 }, { name: 'Regular', price: 0 }, { name: 'Large', price: 0 }])
        setRecipe([])
        setExtras([])
        setMediaFile(null)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
    }

    const sortSizes = (arr: Size[]) => [...arr].sort((a, b) => ['Small', 'Regular', 'Large'].indexOf(a.name) - ['Small', 'Regular', 'Large'].indexOf(b.name))

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-20 h-20 animate-spin text-cyan-400" />
        </div>
    )

    return (
        <>
            <Toaster position="top-center" />
            <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-black text-white p-8">
                <div className="text-center mb-12">
                    <h1 className="text-7xl font-black font-extrabold bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 bg-clip-text text-transparent">
                        PRO MENU MANAGER
                    </h1>
                    <p className="text-3xl mt-4 text-gray-300">Recipe • Extras • Sizes • Image • Inventory Sync</p>
                </div>

                {/* ADD FORM */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-7xl mx-auto bg-white/10 backdrop-blur-3xl rounded-3xl p-10 shadow-4xl border border-purple-500/50"
                >
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* LEFT */}
                        <div className="space-y-8">
                            <input
                                placeholder="Dish Name (e.g. Chicken Kottu)"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-8 py-6 text-3xl rounded-2xl bg-white/20 border border-white/30 focus:border-cyan-400 outline-none"
                            />

                            <div className="flex gap-4">
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="flex-1 px-6 py-5 text-xl rounded-2xl bg-white/20"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <input
                                    placeholder="+ New"
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value)}
                                    className="w-48 px-6 py-5 rounded-2xl bg-white/10"
                                />
                                <button
                                    onClick={() => {
                                        const c = newCategory.trim()
                                        if (!c) return
                                        if (categories.includes(c)) return toast.error('Already exists')
                                        setCategories([...categories, c].sort())
                                        setCategory(c)
                                        setNewCategory('')
                                        toast.success(`Category "${c}" added`)
                                    }}
                                    className="px-8 py-5 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-bold"
                                >
                                    Add
                                </button>
                            </div>

                            {/* SIZES */}
                            <div className="bg-white/10 rounded-3xl p-8">
                                <h3 className="text-2xl font-bold text-cyan-300 mb-6">Sizes & Prices</h3>
                                {sizes.map((s, i) => (
                                    <div key={i} className="flex gap-4 mb-4 items-center">
                                        <input
                                            value={s.name}
                                            onChange={e => setSizes(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                                            className="w-48 px-5 py-4 rounded-xl bg-white/20"
                                        />
                                        <input
                                            type="number"
                                            value={s.price || ''}
                                            onChange={e => setSizes(p => p.map((x, j) => j === i ? { ...x, price: Number(e.target.value) } : x))}
                                            placeholder="Price"
                                            className="w-40 px-5 py-4 rounded-xl bg-white/20"
                                        />
                                        <button
                                            onClick={() => setSizes(p => p.filter((_, j) => j !== i))}
                                            className="p-4 bg-red-600 hover:bg-red-700 rounded-xl"
                                        >
                                            <Trash2 className="w-6 h-6" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setSizes(p => [...p, { name: `Size ${p.length + 1}`, price: 0 }])}
                                    className="mt-4 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-xl font-bold"
                                >
                                    + Add Size
                                </button>
                            </div>

                            {/* RECIPE */}
                            <div className="bg-white/10 rounded-3xl p-8">
                                <h3 className="text-2xl font-bold text-green-400 mb-6">Recipe (Auto Deduct)</h3>
                                <div className="space-y-4">
                                    <div className="flex gap-y-2">
                                        <select
                                            value={newIngredientId}
                                            onChange={e => setNewIngredientId(e.target.value)}
                                            className="w-full px-6 py-4 rounded-xl bg-white/20"
                                        >
                                            <option value="">Select Ingredient</option>
                                            {inventory.map(i => (
                                                <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                                            ))}
                                        </select>
                                        <div className="grid grid-cols-3 gap-4 mt-4">
                                            {sizes.map(s => (
                                                <div key={s.name}>
                                                    <label className="text-sm text-gray-300">{s.name}</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={newIngredientQtys[s.name] ?? ''}
                                                        onChange={e => setNewIngredientQtys(p => ({ ...p, [s.name]: Number(e.target.value) }))}
                                                        className="w-full px-4 py-2 rounded-lg bg-white/10"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={addRecipeItem}
                                            className="mt-4 w-full py-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold"
                                        >
                                            + Add to Recipe
                                        </button>
                                    </div>

                                    {recipe.map((r, i) => (
                                        <div key={i} className="bg-white/5 rounded-xl p-5 rounded-xl">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="font-bold text-lg">{r.ingredientName}</span>
                                                <button onClick={() => setRecipe(p => p.filter((_, j) => j !== i))} className="text-red-400">
                                                    <X className="w-6 h-6" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3 text-sm">
                                                {sizes.map(s => (
                                                    <div key={s.name}>
                                                        <span className="text-gray-400">{s.name}:</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={r.quantities[s.name] ?? 0}
                                                            onChange={e => {
                                                                const val = Number(e.target.value)
                                                                setRecipe(p => p.map((x, j) => j === i ? { ...x, quantities: { ...x.quantities, [s.name]: val } } : x))
                                                            }}
                                                            className="w-full px-3 py-1 bg-white/10 rounded"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* EXTRAS */}
                            <div className="bg-white/10 rounded-3xl p-8">
                                <h3 className="text-2xl font-bold text-orange-400 mb-6">Extras</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <input placeholder="Name" value={newExtraName} onChange={e => setNewExtraName(e.target.value)} className="px-5 py-4 rounded-xl bg-white/20" />
                                    <input type="number" placeholder="Price (+Rs)" value={newExtraPrice} onChange={e => setNewExtraPrice(e.target.value)} className="px-5 py-4 rounded-xl bg-white/20" />
                                    <input type="number" step="0.01" placeholder="Qty per unit" value={newExtraQty} onChange={e => setNewExtraQty(e.target.value)} className="px-5 py-4 rounded-xl bg-white/20" />
                                    <select value={newExtraIngredientId} onChange={e => setNewExtraIngredientId(e.target.value)} className="px-5 py-4 rounded-xl bg-white/20">
                                        <option value="">Link Ingredient</option>
                                        {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                    </select>
                                </div>
                                <button onClick={addExtra} className="w-full mt-6 py-4 bg-orange-600 hover:bg-orange-700 rounded-xl font-bold">
                                    + Add Extra
                                </button>

                                {extras.map((e, i) => (
                                    <div key={i} className="mt-4 p-4 bg-white/10 rounded-xl flex justify-between items-center">
                                        <div>
                                            <span className="font-bold">{e.name}</span> +Rs {e.price} ({e.quantityPerUnit}× {inventory.find(x => x.id === e.ingredientId)?.name})
                                        </div>
                                        <button onClick={() => setExtras(p => p.filter((_, j) => j !== i))} className="text-red-400">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT - IMAGE */}
                        <div className="flex flex-col items-center">
                            <label className="cursor-pointer w-full">
                                <div className="border-4 border-dashed border-purple-500 rounded-3xl h-96 flex items-center justify-center bg-white/5 hover:bg-white/10 transition">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="max-h-full rounded-2xl" />
                                    ) : (
                                        <div className="text-center">
                                            <Camera className="w-28 h-28 text-purple-400 mb-4" />
                                            <p className="text-xl text-gray-400">Click to upload image</p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            setMediaFile(file)
                                            setPreviewUrl(URL.createObjectURL(file))
                                        }
                                    }}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="text-center mt-12">
                        <button
                            onClick={handleSubmit}
                            disabled={uploading}
                            className="px-32 py-8 text-5xl font-extrabold bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 rounded-full shadow-2xl transform hover:scale-105 disabled:opacity-60"
                        >
                            {uploading ? 'SAVING...' : 'ADD MENU ITEM'}
                        </button>
                    </div>
                </motion.div>

                {/* CURRENT MENU */}
                <div className="max-w-7xl mx-auto mt-20">
                    <h2 className="text-6xl font-bold text-center mb-12 text-cyan-300">
                        Current Menu ({menu.length} items)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {menu.map(item => (
                            <motion.div
                                key={item.id}
                                layout
                                className="bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden border border-purple-500/50"
                            >
                                {item.mediaUrl ? (
                                    <img src={item.mediaUrl} alt={item.name} className="w-full h-64 object-cover" />
                                ) : (
                                    <div className="h-64 bg-gradient-to-br from-purple-800 to-pink-800 flex items-center justify-center">
                                        <Package className="w-20 h-20 text-white/20" />
                                    </div>
                                )}
                                <div className="p-6">
                                    <h3 className="text-3xl font-bold text-cyan-300">{item.name}</h3>
                                    <p className="text-purple-300 text-lg">{item.category}</p>

                                    <div className="mt-4 space-y-3">
                                        {sortSizes(item.sizes || []).map(s => (
                                            <div key={s.name} className="flex justify-between text-green-400 font-bold text-xl">
                                                <span>{s.name}</span>
                                                <span>Rs {s.price}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {item.extras?.length > 0 && (
                                        <div className="mt-6 pt-6 border-t border-white/20">
                                            <p className="text-orange-400 font-bold mb-2">+ Extras</p>
                                            {item.extras.map(e => (
                                                <div key={e.id} className="text-sm text-gray-300">• {e.name} +Rs {e.price}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

export default MenuManager