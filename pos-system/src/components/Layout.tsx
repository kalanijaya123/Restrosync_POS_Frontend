import React from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex">
            <Sidebar />
            <div className="ml-64 flex-1">
                <Header />

                <div className="pt-24 px-10 bg-gray-100 min-h-screen">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default Layout