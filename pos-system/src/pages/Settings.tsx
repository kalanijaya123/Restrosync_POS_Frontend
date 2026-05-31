import { useEffect, useMemo, useState } from 'react'
import {
    defaultDiscountSettings,
    getDiscountSettings,
    saveDiscountSettings
} from '../utils/discounts'
import type { DiscountSettings } from '../utils/discounts'
import { getApiUrl } from '../services/api'
import LocationPickerMap from '../components/LocationPickerMap'

type DeliveryRange = {
    maxDistanceKm: number
    fee: number
}

type DeliverySettings = {
    id?: string
    restaurantLatitude: number
    restaurantLongitude: number
    ranges: DeliveryRange[]
}

const monthLabels: Array<{ key: keyof DiscountSettings['monthlyDiscounts']; label: string }> = [
    { key: 'january', label: 'January' },
    { key: 'february', label: 'February' },
    { key: 'march', label: 'March' },
    { key: 'april', label: 'April' },
    { key: 'may', label: 'May' },
    { key: 'june', label: 'June' },
    { key: 'july', label: 'July' },
    { key: 'august', label: 'August' },
    { key: 'september', label: 'September' },
    { key: 'october', label: 'October' },
    { key: 'november', label: 'November' },
    { key: 'december', label: 'December' }
]

const defaultDeliverySettings: DeliverySettings = {
    restaurantLatitude: 6.9271,
    restaurantLongitude: 79.8612,
    ranges: [
        { maxDistanceKm: 3, fee: 200 },
        { maxDistanceKm: 6, fee: 350 },
        { maxDistanceKm: 10, fee: 500 }
    ]
}

const Settings = () => {
    const [discountSettings, setDiscountSettings] = useState<DiscountSettings>(defaultDiscountSettings)
    const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(defaultDeliverySettings)
    const [saveMessage, setSaveMessage] = useState('')
    const [deliverySaveMessage, setDeliverySaveMessage] = useState('')
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null')
    const isManager = currentUser?.role === 'Manager'

    useEffect(() => {
        const loadDiscountSettings = async () => {
            try {
                const res = await fetch(getApiUrl('/discount-settings'))
                if (!res.ok) throw new Error('Failed to load shared discount settings')

                const data = await res.json()
                const merged = {
                    ...defaultDiscountSettings,
                    ...data,
                    monthlyDiscounts: {
                        ...defaultDiscountSettings.monthlyDiscounts,
                        ...(data.monthlyDiscounts || {})
                    }
                }

                setDiscountSettings(merged)
                saveDiscountSettings(merged)
            } catch {
                setDiscountSettings(getDiscountSettings())
            }
        }

        const loadDeliverySettings = async () => {
            try {
                const res = await fetch(getApiUrl('/delivery-settings'))
                if (!res.ok) throw new Error('Failed to load delivery settings')

                const data = await res.json()
                const normalizedRanges = Array.isArray(data?.ranges)
                    ? data.ranges
                        .filter((range: any) => Number(range?.maxDistanceKm) > 0)
                        .map((range: any) => ({
                            maxDistanceKm: Number(range.maxDistanceKm),
                            fee: Math.max(0, Number(range.fee) || 0)
                        }))
                        .sort((a: DeliveryRange, b: DeliveryRange) => a.maxDistanceKm - b.maxDistanceKm)
                    : defaultDeliverySettings.ranges

                setDeliverySettings({
                    id: data?.id,
                    restaurantLatitude: Number(data?.restaurantLatitude) || defaultDeliverySettings.restaurantLatitude,
                    restaurantLongitude: Number(data?.restaurantLongitude) || defaultDeliverySettings.restaurantLongitude,
                    ranges: normalizedRanges.length > 0 ? normalizedRanges : defaultDeliverySettings.ranges
                })
            } catch {
                setDeliverySettings(defaultDeliverySettings)
            }
        }

        void loadDiscountSettings()
        void loadDeliverySettings()
    }, [])

    const activeMonthlyOffers = useMemo(
        () => Object.values(discountSettings.monthlyDiscounts).filter(v => v > 0).length,
        [discountSettings.monthlyDiscounts]
    )

    const updateNumberField = (field: keyof DiscountSettings, value: string) => {
        const parsed = Number(value)
        const safe = Number.isFinite(parsed) ? Math.max(0, parsed) : 0

        setDiscountSettings(prev => ({
            ...prev,
            [field]: safe
        }))
    }

    const updateMonthDiscount = (month: keyof DiscountSettings['monthlyDiscounts'], value: string) => {
        const parsed = Number(value)
        const clamped = Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0

        setDiscountSettings(prev => ({
            ...prev,
            monthlyDiscounts: {
                ...prev.monthlyDiscounts,
                [month]: clamped
            }
        }))
    }

    const updateDeliveryRange = (index: number, field: keyof DeliveryRange, value: string) => {
        setDeliverySettings(prev => {
            const next = [...prev.ranges]
            const parsed = Number(value)
            next[index] = {
                ...next[index],
                [field]: Number.isFinite(parsed) ? Math.max(0, parsed) : 0
            }
            return { ...prev, ranges: next }
        })
    }

    const addDeliveryRange = () => {
        setDeliverySettings(prev => {
            const lastMax = prev.ranges.length > 0 ? prev.ranges[prev.ranges.length - 1].maxDistanceKm : 0
            return {
                ...prev,
                ranges: [...prev.ranges, { maxDistanceKm: lastMax + 2, fee: 0 }]
            }
        })
    }

    const removeDeliveryRange = (index: number) => {
        setDeliverySettings(prev => {
            const next = prev.ranges.filter((_, i) => i !== index)
            return {
                ...prev,
                ranges: next.length > 0 ? next : [{ maxDistanceKm: 3, fee: 200 }]
            }
        })
    }

    const handleSaveDiscountSettings = async () => {
        saveDiscountSettings(discountSettings)

        try {
            const res = await fetch(getApiUrl('/discount-settings'), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    userId: currentUser?.id || ''
                },
                body: JSON.stringify(discountSettings)
            })

            if (!res.ok) {
                throw new Error('Failed to sync discount settings')
            }

            setSaveMessage('Discount settings saved and synced successfully.')
        } catch {
            setSaveMessage('Discount settings saved locally. Backend sync failed.')
        }

        setTimeout(() => setSaveMessage(''), 2500)
    }

    const handleSaveDeliverySettings = async () => {
        const cleanedRanges = [...deliverySettings.ranges]
            .filter(range => Number(range.maxDistanceKm) > 0)
            .map(range => ({
                maxDistanceKm: Number(range.maxDistanceKm),
                fee: Math.max(0, Number(range.fee) || 0)
            }))
            .sort((a, b) => a.maxDistanceKm - b.maxDistanceKm)

        if (cleanedRanges.length === 0) {
            setDeliverySaveMessage('Add at least one valid distance range before saving.')
            setTimeout(() => setDeliverySaveMessage(''), 2500)
            return
        }

        const payload = {
            ...deliverySettings,
            restaurantLatitude: deliverySettings.restaurantLatitude,
            restaurantLongitude: deliverySettings.restaurantLongitude,
            ranges: cleanedRanges
        }

        try {
            const res = await fetch(getApiUrl('/delivery-settings'), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    userId: currentUser?.id || ''
                },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                throw new Error('Failed to save delivery settings')
            }

            const saved = await res.json()
            setDeliverySettings({
                id: saved?.id,
                restaurantLatitude: Number(saved?.restaurantLatitude) || payload.restaurantLatitude,
                restaurantLongitude: Number(saved?.restaurantLongitude) || payload.restaurantLongitude,
                ranges: Array.isArray(saved?.ranges) && saved.ranges.length > 0 ? saved.ranges : payload.ranges
            })
            setDeliverySaveMessage('Delivery settings saved successfully.')
        } catch {
            setDeliverySaveMessage('Failed to save delivery settings.')
        }

        setTimeout(() => setDeliverySaveMessage(''), 2500)
    }

    return (
        <div>
            <h1 className="text-5xl font-bold mb-8 text-gray-900 dark:text-white">Settings</h1>

            {!isManager && (
                <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-6 py-5 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                    <h2 className="text-2xl font-bold mb-2">Manager access required</h2>
                    <p>Only managers can change discount rules and delivery fees.</p>
                </div>
            )}

            <div className="space-y-8">
                <section className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-8 rounded-3xl shadow-xl ${!isManager ? 'opacity-60 pointer-events-none select-none' : ''}`}>
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Customer Discount Rules</h2>
                        <span className="text-sm px-3 py-2 rounded-full bg-brand/20 text-brand font-semibold">
                            {activeMonthlyOffers} monthly offers active
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {monthLabels.map(({ key, label }) => (
                            <label key={key} className="bg-gray-50 dark:bg-slate-700/70 p-4 rounded-xl border border-gray-200 dark:border-slate-600">
                                <span className="block font-semibold text-gray-800 dark:text-gray-200 mb-2">{label}</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step="0.5"
                                        value={discountSettings.monthlyDiscounts[key]}
                                        onChange={(e) => updateMonthDiscount(key, e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                    />
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">%</span>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 dark:bg-slate-700/70 p-5 rounded-xl border border-gray-200 dark:border-slate-600">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">High Value Customer Rule</h4>
                            <label className="block mb-3 text-sm text-gray-700 dark:text-gray-300">Highest order threshold (Rs)</label>
                            <input
                                type="number"
                                value={discountSettings.highestOrderThreshold}
                                onChange={(e) => updateNumberField('highestOrderThreshold', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            />
                            <label className="block mt-4 mb-3 text-sm text-gray-700 dark:text-gray-300">Discount percentage</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step="0.5"
                                    value={discountSettings.highestOrderDiscountPercent}
                                    onChange={(e) => updateNumberField('highestOrderDiscountPercent', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                />
                                <span className="font-semibold">%</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-700/70 p-5 rounded-xl border border-gray-200 dark:border-slate-600">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Loyalty Collection Rule</h4>
                            <label className="block mb-3 text-sm text-gray-700 dark:text-gray-300">Paid collection threshold (Rs)</label>
                            <input
                                type="number"
                                value={discountSettings.cumulativeSpendThreshold}
                                onChange={(e) => updateNumberField('cumulativeSpendThreshold', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            />
                            <label className="block mt-4 mb-3 text-sm text-gray-700 dark:text-gray-300">Discount percentage</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step="0.5"
                                    value={discountSettings.cumulativeSpendDiscountPercent}
                                    onChange={(e) => updateNumberField('cumulativeSpendDiscountPercent', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                />
                                <span className="font-semibold">%</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-700/70 p-5 rounded-xl border border-gray-200 dark:border-slate-600">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Large Bill Rule</h4>
                            <label className="block mb-3 text-sm text-gray-700 dark:text-gray-300">Order value threshold (Rs)</label>
                            <input
                                type="number"
                                value={discountSettings.largeOrderThreshold}
                                onChange={(e) => updateNumberField('largeOrderThreshold', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            />
                            <label className="block mt-4 mb-3 text-sm text-gray-700 dark:text-gray-300">Discount percentage</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step="0.5"
                                    value={discountSettings.largeOrderDiscountPercent}
                                    onChange={(e) => updateNumberField('largeOrderDiscountPercent', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                />
                                <span className="font-semibold">%</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-700/70 p-5 rounded-xl border border-gray-200 dark:border-slate-600">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Safety Limit</h4>
                            <label className="block mb-3 text-sm text-gray-700 dark:text-gray-300">Maximum total discount (%)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step="0.5"
                                    value={discountSettings.maxTotalDiscountPercent}
                                    onChange={(e) => updateNumberField('maxTotalDiscountPercent', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                />
                                <span className="font-semibold">%</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <button
                            onClick={handleSaveDiscountSettings}
                            disabled={!isManager}
                            className="bg-brand hover:bg-brand/90 text-white px-8 py-3 rounded-xl text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Discount Settings
                        </button>
                        {saveMessage && <p className="text-green-600 dark:text-green-400 font-medium">{saveMessage}</p>}
                    </div>
                </section>

                <section className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-8 rounded-3xl shadow-xl ${!isManager ? 'opacity-60 pointer-events-none select-none' : ''}`}>
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Delivery Fee by Distance</h2>
                        <button
                            onClick={handleSaveDeliverySettings}
                            disabled={!isManager}
                            className="bg-brand hover:bg-brand/90 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Delivery Settings
                        </button>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        Click on the map to set the restaurant location. Delivery fees are applied by the first distance range that matches.
                    </p>

                    <LocationPickerMap
                        center={{
                            lat: deliverySettings.restaurantLatitude,
                            lng: deliverySettings.restaurantLongitude
                        }}
                        selected={{
                            lat: deliverySettings.restaurantLatitude,
                            lng: deliverySettings.restaurantLongitude
                        }}
                        onSelect={(coords) => {
                            setDeliverySettings(prev => ({
                                ...prev,
                                restaurantLatitude: Number(coords.lat.toFixed(6)),
                                restaurantLongitude: Number(coords.lng.toFixed(6))
                            }))
                        }}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                        <label className="block">
                            <span className="block mb-2 text-sm text-gray-700 dark:text-gray-300">Restaurant Latitude</span>
                            <input
                                type="number"
                                step="0.000001"
                                value={deliverySettings.restaurantLatitude}
                                onChange={(e) => setDeliverySettings(prev => ({ ...prev, restaurantLatitude: Number(e.target.value) || 0 }))}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            />
                        </label>
                        <label className="block">
                            <span className="block mb-2 text-sm text-gray-700 dark:text-gray-300">Restaurant Longitude</span>
                            <input
                                type="number"
                                step="0.000001"
                                value={deliverySettings.restaurantLongitude}
                                onChange={(e) => setDeliverySettings(prev => ({ ...prev, restaurantLongitude: Number(e.target.value) || 0 }))}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            />
                        </label>
                    </div>

                    <div className="mt-6 space-y-3">
                        {deliverySettings.ranges.map((range, index) => (
                            <div key={`${index}-${range.maxDistanceKm}`} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 dark:bg-slate-700/70 p-4 rounded-xl border border-gray-200 dark:border-slate-600">
                                <label className="md:col-span-5">
                                    <span className="block mb-2 text-sm text-gray-700 dark:text-gray-300">Up to distance (km)</span>
                                    <input
                                        type="number"
                                        min={0.1}
                                        step="0.1"
                                        value={range.maxDistanceKm}
                                        onChange={(e) => updateDeliveryRange(index, 'maxDistanceKm', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                    />
                                </label>
                                <label className="md:col-span-5">
                                    <span className="block mb-2 text-sm text-gray-700 dark:text-gray-300">Delivery fee (Rs)</span>
                                    <input
                                        type="number"
                                        min={0}
                                        step="1"
                                        value={range.fee}
                                        onChange={(e) => updateDeliveryRange(index, 'fee', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={() => removeDeliveryRange(index)}
                                    className="md:col-span-2 px-4 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-600 dark:text-rose-300 dark:hover:bg-rose-900/20"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addDeliveryRange}
                        className="mt-4 px-5 py-2 rounded-lg border border-brand text-brand hover:bg-brand/10"
                    >
                        Add Range
                    </button>

                    {deliverySaveMessage && (
                        <p className="text-green-600 dark:text-green-400 font-medium mt-4">{deliverySaveMessage}</p>
                    )}
                </section>
            </div>
        </div>
    )
}

export default Settings
