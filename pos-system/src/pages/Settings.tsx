
import { useEffect, useMemo, useState } from 'react'
import {
    defaultDiscountSettings,
    getDiscountSettings,
    saveDiscountSettings
} from '../utils/discounts'
import type { DiscountSettings } from '../utils/discounts'
import { getApiUrl } from '../services/api'

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

const Settings = () => {
    const [discountSettings, setDiscountSettings] = useState<DiscountSettings>(defaultDiscountSettings)
    const [saveMessage, setSaveMessage] = useState('')

    useEffect(() => {
        const loadSettings = async () => {
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

        void loadSettings()
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

    const handleSave = async () => {
        saveDiscountSettings(discountSettings)
        try {
            const res = await fetch(getApiUrl('/discount-settings'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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

    return (
        <div>
            <h1 className="text-5xl font-bold mb-8 text-gray-900 dark:text-white">Settings</h1>

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-8 rounded-3xl shadow-xl max-w-6xl">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Customer Discount Rules</h2>
                    <span className="text-sm px-3 py-2 rounded-full bg-brand/20 text-brand font-semibold">
                        {activeMonthlyOffers} monthly offers active
                    </span>
                </div>

                <div className="mb-10">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Monthly Discount Percentages</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-5">
                        Set month-wise promotional discounts. These are automatically applied in Payment based on the order month.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                            Prevents stacking too many discounts on one bill.
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                    <button
                        onClick={handleSave}
                        className="bg-brand hover:bg-brand/90 text-white px-8 py-3 rounded-xl text-lg font-semibold"
                    >
                        Save Discount Settings
                    </button>
                    {saveMessage && <p className="text-green-600 dark:text-green-400 font-medium">{saveMessage}</p>}
                </div>
            </div>
        </div>
    )
}

export default Settings