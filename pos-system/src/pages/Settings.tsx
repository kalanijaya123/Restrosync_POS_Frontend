

const Settings = () => {
    return (
        <div>
            <h1 className="text-5xl font-bold mb-10 text-black">Settings</h1>
            <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-4xl">
                {/* Ensure text inside white card is dark so it is readable against white background */}
                <div className="space-y-10 text-3xl text-gray-800">
                    <div>
                        <label>Tax Rate:</label>
                        <input type="number" defaultValue="15" className="ml-10 w-32 px-6 py-4 border-4 rounded-xl" /> %
                    </div>
                    <div>
                        <label>Printer IP:</label>
                        <input type="text" defaultValue="192.168.1.100" className="ml-10 w-64 px-6 py-4 border-4 rounded-xl" />
                    </div>
                    <div>
                        <label>Serving Hours:</label>
                        <input type="text" defaultValue="11:00 AM - 10:00 PM" className="ml-10 w-80 px-6 py-4 border-4 rounded-xl" />
                    </div>
                    <button className="bg-indigo-700 hover:bg-indigo-800 text-white px-20 py-8 rounded-2xl text-3xl font-bold">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Settings