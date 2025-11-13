import React from 'react'
import Sidebar from './Sidebar'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex">
            <Sidebar />
            <div className="ml-64 flex-1">
                <div className="bg-gray-100 min-h-screen p-10">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default Layout