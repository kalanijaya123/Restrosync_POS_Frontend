import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

export interface Notification {
    id: string
    message: string
    type: 'order' | 'kitchen' | 'payment' | 'system'
    timestamp: Date
    read: boolean
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

        // Show toast
        toast.success(notification.message, {
            duration: 4000,
            icon: '🔔'
        })
    }, [playNotificationSound])

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }, [])

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }, [])

    const clearAll = useCallback(() => {
        setNotifications([])
    }, [])

    const unreadCount = notifications.filter(n => !n.read).length

    // Simulate incoming notifications (connect to WebSocket or polling in production)
    useEffect(() => {
        const checkForNewOrders = async () => {
            try {
                const res = await fetch('http://localhost:8080/api/orders/recent')
                if (res.ok) {
                    const data = await res.json()
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
