// src/pages/MenuManager.tsx – FULL CLOUDINARY VERSION (COMPLETE & WORKING)
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trash2, X, Camera, Loader2, Package, Edit2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { getApiUrl } from '../services/api'

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
    mealPeriods?: string[]
}

const MEAL_PERIODS = ['Breakfast', 'Lunch', 'Dinner'] as const

const normalizeMealPeriods = (mealPeriods?: string[] | null) => {
    const cleaned = Array.from(new Set((mealPeriods || [])
        .map(period => period.trim())
        .filter(Boolean)
        .filter(period => period === 'All Day' || MEAL_PERIODS.includes(period as any))))

    if (cleaned.length === 0 || cleaned.includes('All Day') || cleaned.length === MEAL_PERIODS.length) {
        return [...MEAL_PERIODS]
    }

    return MEAL_PERIODS.filter(period => cleaned.includes(period))
}

const mealPeriodLabel = (mealPeriods?: string[] | null) => {
    const normalized = normalizeMealPeriods(mealPeriods)
    return normalized.length === MEAL_PERIODS.length ? 'All Day' : normalized.join(', ')
}

// CHANGE THESE TO YOUR CLOUDINARY ACCOUNT
const CLOUDINARY_CLOUD_NAME = "dt0bdj2xg"  // ← Your actual cloud name
const CLOUDINARY_UPLOAD_PRESET = "restrosync_menu"  // ← Your unsigned preset name

const MenuManager = () => {
    const [menu, setMenu] = useState<MenuItem[]>([])
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [categories, setCategories] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [mealPeriods, setMealPeriods] = useState<string[]>([...MEAL_PERIODS])

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null)
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

    // Temp for recipe/extra
    const [newIngredientId, setNewIngredientId] = useState('')
    const [newIngredientQtys, setNewIngredientQtys] = useState<Record<string, number>>({})
    const [newExtraName, setNewExtraName] = useState('')
    const [newExtraPrice, setNewExtraPrice] = useState('')
    const [newExtraQty, setNewExtraQty] = useState('')
    const [newExtraIngredientId, setNewExtraIngredientId] = useState('')

    // Keep quantities in sync with sizes
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
                fetch(getApiUrl('/menu')),
                fetch(getApiUrl('/inventory'))
            ])

            if (!menuRes.ok || !invRes.ok) {
                throw new Error(`Server error: ${menuRes.status} / ${invRes.status}`)
            }

            const menuData = await menuRes.json()
            const invData = await invRes.json()

            // Ensure we always have arrays
            setMenu(Array.isArray(menuData) ? menuData : [])
            setInventory(Array.isArray(invData) ? invData : [])

            const cats = [...new Set((Array.isArray(menuData) ? menuData : []).map((m: MenuItem) => m.category))].sort()
            setCategories(cats.length > 0 ? cats : ['Beverages', 'Biriyani', 'Curries', 'Rice', 'Snacks'])
            if (cats.length > 0) setCategory(cats[0])
        } catch (error: any) {
            console.error('Failed to load data:', error)
            toast.error(`Failed to load data: ${error.message}`)
            // Set safe defaults
            setMenu([])
            setInventory([])
            setCategories(['Beverages', 'Biriyani', 'Curries', 'Rice', 'Snacks'])
        } finally {
            setLoading(false)
        }
    }

    // CLOUDINARY DIRECT UPLOAD
    const uploadToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
        formData.append('folder', 'restrosync/menu')

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        })

        if (!res.ok) throw new Error('Upload failed')
        const data = await res.json()
        return data.secure_url
    }

    const handleSubmit = async () => {
        if (!name.trim()) return toast.error('Enter dish name')
        if (!category) return toast.error('Select category')
        if (mealPeriods.length === 0) return toast.error('Select at least one meal period')
        if (sizes.every(s => s.price <= 0)) return toast.error('Set at least one price')

        setUploading(true)

        let imageUrl = previewUrl || ''

        if (mediaFile) {
            try {
                imageUrl = await uploadToCloudinary(mediaFile)
                console.log('✅ Image uploaded to Cloudinary:', imageUrl)
                toast.success('Image uploaded to Cloudinary!')
            } catch (err) {
                console.error('❌ Cloudinary upload failed:', err)
                toast.error('Image upload failed')
                setUploading(false)
                return
            }
        }

        const payload = {
            name: name.trim(),
            category: category.trim(),
            mealPeriods: normalizeMealPeriods(mealPeriods),
            sizes: sizes.filter(s => s.name && s.name.trim() && s.price > 0).map(s => ({
                name: s.name.trim(),
                price: Number(s.price)
            })),
            recipe: recipe || [],
            extras: extras || [],
            mediaUrl: imageUrl || previewUrl || null,
            available: true
        }

        console.log('📤 Sending payload to backend:', payload)
        console.log('🔗 API URL:', editingId ? getApiUrl(`/menu/json/${editingId}`) : getApiUrl('/menu/json'))

        try {
            const url = editingId ? getApiUrl(`/menu/json/${editingId}`) : getApiUrl('/menu/json')
            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            console.log('📥 Backend response status:', res.status)

            const responseData = await res.json()
            console.log('📥 Backend response data:', responseData)

            if (!res.ok) {
                console.error('❌ Backend returned error:', responseData)
                throw new Error(responseData.message || 'Save failed')
            }

            console.log('✅ Menu item saved successfully!')
            toast.success(editingId ? 'Updated!' : 'Added!')
            resetForm()
            fetchAllData()
        } catch (err: any) {
            console.error('❌ Save failed:', err)
            toast.error(err.message || 'Failed to save menu item')
        } finally {
            setUploading(false)
        }
    }

    const handleEdit = (item: MenuItem) => {
        setEditingId(item.id)
        setName(item.name)
        setCategory(item.category)
        setMealPeriods(normalizeMealPeriods(item.mealPeriods))
        setSizes(item.sizes.length > 0 ? item.sizes : [{ name: 'Small', price: 0 }, { name: 'Regular', price: 0 }, { name: 'Large', price: 0 }])
        setRecipe(item.recipe || [])
        setExtras(item.extras || [])
        setPreviewUrl(item.mediaUrl || null)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}" permanently?`)) return
        try {
            const res = await fetch(getApiUrl(`/menu/${id}`), { method: 'DELETE' })
            if (!res.ok) throw new Error()
            toast.success('Deleted')
            fetchAllData()
        } catch {
            toast.error('Delete failed')
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

    const resetForm = () => {
        setEditingId(null)
        setName('')
        setCategory('')
        setMealPeriods([...MEAL_PERIODS])
        setSizes([{ name: 'Small', price: 0 }, { name: 'Regular', price: 0 }, { name: 'Large', price: 0 }])
        setRecipe([])
        setExtras([])
        setMediaFile(null)
        if (previewUrl && !previewUrl.startsWith('http')) {
            URL.revokeObjectURL(previewUrl)
        }
        setPreviewUrl(null)
    }

    const sortSizes = (arr: Size[]) => [...arr].sort((a, b) =>
        ['Small', 'Regular', 'Large'].indexOf(a.name) - ['Small', 'Regular', 'Large'].indexOf(b.name))

    if (loading) return (
        <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
            <Loader2 className="w-20 h-20 animate-spin text-blue-300" />
        </div>
    )

    return (
        <>
            <Toaster position="top-center" />
            <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white p-8 transition-colors">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center rounded-2xl bg-slate-900 px-6 py-3 shadow-lg">
                        <h1 className="text-4xl font-extrabold text-white">PRO MENU MANAGER</h1>
                    </div>
                    <p className="text-lg mt-2 text-gray-300">Recipe • Extras • Sizes • Image • Inventory Sync</p>
                    {editingId && (
                        <div className="mt-4 flex items-center justify-center gap-3">
                            <p className="text-lg text-orange-400 font-bold">Editing Mode</p>
                            <button
                                onClick={resetForm}
                                className="px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-lg font-semibold text-sm"
                            >
                                Cancel Edit
                            </button>
                        </div>
                    )}
                </div>

                {/* ADD FORM */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-7xl mx-auto bg-white/10 backdrop-blur-3xl rounded-2xl p-6 shadow-4xl border border-brand"
                >
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* LEFT */}
                        <div className="space-y-5">
                            <input
                                placeholder="Dish Name (e.g. Chicken Kottu)"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-4 py-3 text-lg rounded-xl bg-white/20 border border-white/30 focus:border-cyan-400 outline-none"
                            />

                            <div className="flex gap-3">
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="flex-1 px-4 py-3 text-base rounded-xl bg-white/20"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <input
                                    placeholder="+ New"
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value)}
                                    className="w-40 px-4 py-3 rounded-xl bg-white/10"
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
                                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-sm"
                                >
                                    Add
                                </button>
                            </div>

                            <div className="bg-white/10 rounded-xl p-4 space-y-3">
                                <div>
                                    <h3 className="text-lg font-bold text-cyan-300">Meal Period</h3>
                                    <p className="text-sm text-gray-300">Select one or more service periods.</p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setMealPeriods([...MEAL_PERIODS])}
                                        className={`px-4 py-2 rounded-full font-semibold ${mealPeriods.length === MEAL_PERIODS.length ? 'bg-cyan-500 text-white' : 'bg-white/10 text-white'}`}
                                    >
                                        All Day
                                    </button>
                                    {MEAL_PERIODS.map(period => {
                                        const active = mealPeriods.includes(period)
                                        return (
                                            <button
                                                key={period}
                                                type="button"
                                                onClick={() => setMealPeriods(prev => {
                                                    const next = prev.includes(period)
                                                        ? prev.filter(item => item !== period)
                                                        : [...prev, period]
                                                    return next.length === 0 ? [...MEAL_PERIODS] : next
                                                })}
                                                className={`px-4 py-2 rounded-full font-semibold ${active ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white'}`}
                                            >
                                                {period}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* SIZES */}
                            <div className="bg-white/10 rounded-xl p-5">
                                <h3 className="text-lg font-bold text-blue-300 mb-4">Sizes & Prices</h3>
                                {sizes.map((s, i) => (
                                    <div key={i} className="flex gap-3 mb-3 items-center">
                                        <input
                                            value={s.name}
                                            onChange={e => setSizes(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                                            className="w-40 px-3 py-2 rounded-lg bg-white/20 text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={s.price || ''}
                                            onChange={e => setSizes(p => p.map((x, j) => j === i ? { ...x, price: Number(e.target.value) } : x))}
                                            placeholder="Price"
                                            className="w-32 px-3 py-2 rounded-lg bg-white/20 text-sm"
                                        />
                                        <button
                                            onClick={() => setSizes(p => p.filter((_, j) => j !== i))}
                                            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setSizes(p => [...p, { name: `Size ${p.length + 1}`, price: 0 }])}
                                    className="mt-3 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-bold text-sm"
                                >
                                    + Add Size
                                </button>
                            </div>

                            {/* RECIPE */}
                            <div className="bg-white/10 rounded-xl p-5">
                                <h3 className="text-lg font-bold text-green-300 mb-4">Recipe (Auto Deduct)</h3>
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-y-2">
                                        <select
                                            value={newIngredientId}
                                            onChange={e => setNewIngredientId(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg bg-white/20 text-sm"
                                        >
                                            <option value="">Select Ingredient</option>
                                            {inventory.map(i => (
                                                <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                                            ))}
                                        </select>
                                        <div className="grid grid-cols-3 gap-4 mt-2">
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
                                            className="mt-3 w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-sm"
                                        >
                                            + Add to Recipe
                                        </button>
                                    </div>

                                    {recipe.map((r, i) => (
                                        <div key={i} className="bg-white/5 rounded-xl p-5">
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
                            <div className="bg-white/10 rounded-xl p-5">
                                <h3 className="text-lg font-bold text-orange-400 mb-4">Extras</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <input placeholder="Name" value={newExtraName} onChange={e => setNewExtraName(e.target.value)} className="px-3 py-2 rounded-lg bg-white/20 text-sm" />
                                    <input type="number" placeholder="Price (+Rs)" value={newExtraPrice} onChange={e => setNewExtraPrice(e.target.value)} className="px-3 py-2 rounded-lg bg-white/20 text-sm" />
                                    <input type="number" step="0.01" placeholder="Qty per unit" value={newExtraQty} onChange={e => setNewExtraQty(e.target.value)} className="px-3 py-2 rounded-lg bg-white/20 text-sm" />
                                    <select value={newExtraIngredientId} onChange={e => setNewExtraIngredientId(e.target.value)} className="px-3 py-2 rounded-lg bg-white/20 text-sm">
                                        <option value="">Link Ingredient</option>
                                        {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                    </select>
                                </div>
                                <button onClick={addExtra} className="w-full mt-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-bold text-sm">+ Add Extra</button>

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
                                <div className="border-2 border-dashed border-brand rounded-xl h-80 flex items-center justify-center bg-white/5 hover:bg-white/10 transition">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="max-h-full rounded-2xl" />
                                    ) : (
                                        <div className="text-center">
                                            <Camera className="w-16 h-16 text-brand mb-3" />
                                            <p className="text-base text-gray-400">Click to upload image</p>
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

                    <div className="text-center mt-6 flex gap-4 justify-center">
                        {editingId && (
                            <button
                                onClick={resetForm}
                                className="px-8 py-3 text-base font-bold bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-xl shadow-lg"
                            >
                                CANCEL
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={uploading}
                            className="px-12 py-3 text-lg font-bold bg-brand text-white rounded-xl shadow-lg transform hover:scale-105 disabled:opacity-60"
                        >
                            {uploading ? 'SAVING...' : editingId ? 'UPDATE ITEM' : 'ADD MENU ITEM'}
                        </button>
                    </div>
                </motion.div>

                {/* CURRENT MENU */}
                <div className="max-w-7xl mx-auto mt-12">
                    <h2 className="text-3xl font-bold text-center mb-8 text-blue-300">
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
                                    <div className="h-64 bg-linear-to-br from-purple-800 to-pink-800 flex items-center justify-center">
                                        <Package className="w-20 h-20 text-white/20" />
                                    </div>
                                )}
                                <div className="p-6">
                                    <h3 className="text-3xl font-bold text-blue-300">{item.name}</h3>
                                    <p className="text-purple-300 text-lg">{item.category}</p>
                                    <p className="text-cyan-300 text-sm font-semibold mt-1">{mealPeriodLabel(item.mealPeriods)}</p>

                                    <div className="mt-4 space-y-3">
                                        {sortSizes(item.sizes || []).map(s => (
                                            <div key={s.name} className="flex justify-between text-green-300 font-bold text-xl">
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

                                    <div className="mt-6 pt-6 border-t border-white/20 flex gap-3">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white transition"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id, item.name)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-white transition"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                            Delete
                                        </button>
                                    </div>
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