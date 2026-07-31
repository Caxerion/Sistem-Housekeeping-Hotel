import { useState } from 'react';
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DataKamar from "./pages/DataKamar";
import StatusKamar from "./pages/StatusKamar";
import RiwayatPembersihan from "./pages/RiwayatPembersihan";
import PembagianMaintenance from "./pages/PembagianMaintenance";
import LogsKamar from "./pages/LogsKamar";
import Inventory from "./pages/Inventory";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Staff from './pages/Staff';

function App () {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const sidebarWidth = sidebarCollapsed ? 'md:ml-16' : 'md:ml-56';

    const toggleMobileSidebar = () => setMobileSidebarOpen((prev) => !prev);
    const closeMobileSidebar = () => setMobileSidebarOpen(false);

    const routeLayout = (pageTitle, children) => (
        <div className="flex min-h-screen bg-gray-50 relative">
            <Sidebar 
                collapsed={sidebarCollapsed} 
                onToggle={() => setSidebarCollapsed(prev => !prev)}
                mobileOpen={mobileSidebarOpen}
                onMobileClose={closeMobileSidebar}
            />
            <div className={`flex-1 pt-20 ${sidebarWidth}`}>
                <Navbar pageTitle={pageTitle} />
                {children}
            </div>
        </div>
    );

    return(
        <Routes>
            <Route path="/login" element={<Login/>}/>
            <Route path="/register" element={<Register/>}/>
            <Route path="/dashboard" element={routeLayout('Dashboard', <Dashboard/>)}/>
            <Route path="/" element={routeLayout('Dashboard', <Dashboard/>)}/>
            <Route path="/staff" element={routeLayout('Staff', <Staff/>)}/>
            <Route path="/datakamar" element={routeLayout('Data Kamar', <DataKamar/>)}/>
            <Route path="/statuskamar" element={routeLayout('Status Kamar', <StatusKamar/>)}/>
            <Route path="/riwayatpembersihan" element={routeLayout('Riwayat Pembersihan', <RiwayatPembersihan/>)}/>
            <Route path="/pembagian-maintenance" element={routeLayout('Pembagian Maintenance', <PembagianMaintenance/>)}/>
            <Route path="/inventory" element={routeLayout('Inventory', <Inventory/>)}/>
            <Route path="/logs-kamar" element={routeLayout('Logs Kamar', <LogsKamar/>)}/>
        </Routes>
    )
}

export default App;