import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getApiUrl } from '../services/api'

export interface Notification {
    id: string
    message: string
    type: 'order' | 'kitchen' | 'payment' | 'system' | 'inventory'
    timestamp: Date
    read: boolean
    persistent?: boolean // For inventory low stock notifications
    inventoryId?: string // To track which inventory item
}

interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [lowStockItems, setLowStockItems] = useState<Set<string>>(new Set())
    const [readyOrders, setReadyOrders] = useState<Set<string>>(new Set())

    // Sound effect for notifications
    const playNotificationSound = useCallback(() => {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYHGWi56+aeUwwN')
        audio.volume = 0.3
        audio.play().catch(() => { }) // Ignore errors if sound fails
    }, [])

    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(),
            timestamp: new Date(),
            read: false
        }

        setNotifications(prev => [newNotification, ...prev])

        // Play sound
        playNotificationSound()

        // Toast messages removed - notifications shown in notification bar only
    }, [playNotificationSound])

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }, [])

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }, [])

    const clearAll = useCallback(() => {
        // Only clear non-persistent notifications
        setNotifications(prev => prev.filter(n => n.persistent))
    }, [])

    const unreadCount = notifications.filter(n => !n.read).length

    // Check for low stock inventory items
    useEffect(() => {
        const checkInventory = async () => {
            try {
                const res = await fetch(getApiUrl('/inventory'))
                if (res.ok) {
                    const items = await res.json()
                    const currentLowStockIds = new Set<string>()

                    items.forEach((item: any) => {
                        if (item.currentStock <= item.lowStockAlert) {
                            currentLowStockIds.add(item.id)

                            // Only add notification if this item wasn't already flagged
                            if (!lowStockItems.has(item.id)) {
                                const notificationId = `inventory-${item.id}`

                                // Check if notification already exists
                                const exists = notifications.some(n => n.id === notificationId)

                                if (!exists) {
                                    const newNotification: Notification = {
                                        id: notificationId,
                                        message: `⚠️ Low Stock Alert: ${item.name} (${item.currentStock} ${item.unit} remaining)`,
                                        type: 'inventory',
                                        timestamp: new Date(),
                                        read: false,
                                        persistent: true,
                                        inventoryId: item.id
                                    }
                                    setNotifications(prev => [newNotification, ...prev])
                                    playNotificationSound()
                                    // Toast removed - notification shown in notification bar only
                                }
                            }
                        } else {
                            // Stock is above alert level, remove notification if it exists
                            setNotifications(prev => prev.filter(n => n.inventoryId !== item.id))
                        }
                    })

                    setLowStockItems(currentLowStockIds)
                }
            } catch (err) {
                console.error('Failed to check inventory:', err)
            }
        }

        checkInventory()
        const interval = setInterval(checkInventory, 30000) // Check every 30 seconds
        return () => clearInterval(interval)
    }, [lowStockItems, notifications, playNotificationSound])

    // Check for ready orders in kitchen
    useEffect(() => {
        const checkKitchenOrders = async () => {
            try {
                const res = await fetch(getApiUrl('/orders/kds'))
                if (res.ok) {
                    const orders = await res.json()
                    const currentReadyIds = new Set<string>()

                    orders.forEach((order: any) => {
                        if (order.status === 'ready') {
                            currentReadyIds.add(order.id)

                            // Only add notification if this order wasn't already flagged as ready
                            if (!readyOrders.has(order.id)) {
                                const orderLabel = order.kotToken || `Order #${order.orderNo || order.id.slice(-6).toUpperCase()}`
                                const tableInfo = order.tableNumber || order.table || (order.tableId ? `Table ${order.tableId}` : 'Takeaway')

                                const newNotification: Notification = {
                                    id: `ready-${order.id}-${Date.now()}`,
                                    message: `✅ ${orderLabel} is ready for ${tableInfo}`,
                                    type: 'kitchen',
                                    timestamp: new Date(),
                                    read: false,
                                    persistent: false
                                }
                                setNotifications(prev => [newNotification, ...prev])
                                playNotificationSound()
                                // Toast removed - notification shown in notification bar only
                            }
                        }
                    })

                    setReadyOrders(currentReadyIds)
                }
            } catch (err) {
                console.error('Failed to check kitchen orders:', err)
            }
        }

        checkKitchenOrders()
        const interval = setInterval(checkKitchenOrders, 5000) // Check every 5 seconds
        return () => clearInterval(interval)
    }, [readyOrders, playNotificationSound])

    // Simulate incoming notifications (connect to WebSocket or polling in production)
    useEffect(() => {
        const checkForNewOrders = async () => {
            try {
                const res = await fetch(getApiUrl('/orders/recent'))
                if (res.ok) {
                    await res.json()
                    // Check if there are new orders and add notification
                    // This is a simple example - implement proper logic based on your needs
                }
            } catch (err) {
                // Silently fail
            }
        }

        const interval = setInterval(checkForNewOrders, 30000) // Check every 30 seconds
        return () => clearInterval(interval)
    }, [addNotification])

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearAll
        }}>
            {children}
        </NotificationContext.Provider>
    )
}

export const useNotifications = () => {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider')
    }
    return context
}
