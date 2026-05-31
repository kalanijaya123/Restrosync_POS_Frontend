import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import TableLayout from './pages/TableLayout'
import OrderEntry from './pages/OrderEntry'
import Payment from './pages/Payment'
import OrderHistory from './pages/OrderHistory'
import ManagerDashboard from './pages/ManagerDashboard'
import Inventory from './pages/Inventory'
import KitchenStatus from './pages/KitchenStatus'
import ThirdPartyOrders from './pages/ThirdPartyOrders'
import Settings from './pages/Settings'
import OrderSummary from './pages/OrderSummary'
import MenuManager from './pages/MenuManager'
import ManageOrderItems from './pages/ManageOrderItems'

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || 'null')
  } catch {
    return null
  }
}

const hasPosAccess = () => {
  const user = getCurrentUser()
  return Boolean(
    user && (
      user.role === 'Manager' ||
      user.canAccessPos ||
      user.canManageMenu ||
      user.canManageInventory ||
      user.canAccessKitchenStatus ||
      user.canAccessThirdPartyOrders
    )
  )
}

const hasManagerAccess = () => {
  const user = getCurrentUser()
  return Boolean(user && (user.role === 'Manager' || user.canManageDiscounts))
}

const hasMenuManagementAccess = () => {
  const user = getCurrentUser()
  return Boolean(user && (user.role === 'Manager' || user.canManageMenu))
}

const hasInventoryAccess = () => {
  const user = getCurrentUser()
  return Boolean(user && (user.role === 'Manager' || user.canManageInventory))
}

const hasKitchenStatusAccess = () => {
  const user = getCurrentUser()
  return Boolean(user && (user.role === 'Manager' || user.canAccessKitchenStatus))
}

const hasThirdPartyOrdersAccess = () => {
  const user = getCurrentUser()
  return Boolean(user && (user.role === 'Manager' || user.canAccessThirdPartyOrders))
}

const PosGuard = ({ children }: { children: React.ReactNode }) => {
  return hasPosAccess() ? <>{children}</> : <Navigate to="/" replace />
}

const ManagerGuard = ({ children }: { children: React.ReactNode }) => {
  return hasManagerAccess() ? <>{children}</> : <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <Toaster position="top-right" />
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/*" element={
              <PosGuard>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    {<Route path="/tables" element={<TableLayout />} />}
                    {<Route path="/orders" element={<OrderEntry />} />}
                    {<Route path="/orders/:tableId" element={<OrderEntry />} />}
                    {<Route path="/summary" element={<OrderSummary />} />}
                    {<Route path="/payment" element={<Payment />} />}
                    {<Route path="/history" element={<OrderHistory />} />}
                    {<Route path="/manager" element={<ManagerGuard><ManagerDashboard /></ManagerGuard>} />}
                    {<Route path="/inventory" element={hasInventoryAccess() ? <Inventory /> : <Navigate to="/dashboard" replace />} />}
                    {<Route path="/status" element={hasKitchenStatusAccess() ? <KitchenStatus /> : <Navigate to="/dashboard" replace />} />}
                    {<Route path="/manage-items" element={<ManageOrderItems />} />}
                    {<Route path="/third-party" element={hasThirdPartyOrdersAccess() ? <ThirdPartyOrders /> : <Navigate to="/dashboard" replace />} />}
                    {<Route path="/settings" element={<ManagerGuard><Settings /></ManagerGuard>} />}
                    {<Route path="/menu-manager" element={hasMenuManagementAccess() ? <MenuManager /> : <Navigate to="/dashboard" replace />} />}
                  </Routes>
                </Layout>
              </PosGuard>
            } />
          </Routes>
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  )
}

export default App