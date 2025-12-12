import React from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex min-h-screen transition-colors">
            <Sidebar />
            <div className="ml-64 flex-1 bg-white dark:bg-slate-900">
                <Header />

                <div className="pt-24 px-8 pb-8 min-h-screen">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default Layout