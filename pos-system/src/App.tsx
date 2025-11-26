import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              {<Route path="/tables" element={<TableLayout />} />}
              {<Route path="/orders" element={<OrderEntry />} />}
              {<Route path="/orders/:tableId" element={<OrderEntry />} />}
              {<Route path="/summary" element={<OrderSummary />} />}
              {<Route path="/payment" element={<Payment />} />}
              {<Route path="/history" element={<OrderHistory />} />}
              {<Route path="/manager" element={<ManagerDashboard />} />}
              {<Route path="/inventory" element={<Inventory />} />}
              {<Route path="/status" element={<KitchenStatus />} />}
              {<Route path="/third-party" element={<ThirdPartyOrders />} />}
              {<Route path="/settings" element={<Settings />} />}
              {<Route path="/menu-manager" element={<MenuManager />} />}
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  )
}

export default App