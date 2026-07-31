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
import Staff from './pages/Staff';

function App () {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const sidebarWidth = sidebarCollapsed ? 'ml-16' : 'ml-56';

    return(
        <Routes>
            <Route path="/login" element={<Login/>}/>
            <Route path="/dashboard" element={
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)}/>
                    <div className={`flex-1 ${sidebarWidth} pt-20`}>
                        <Navbar pageTitle="Dashboard"/>
                        <Dashboard/>
                    </div>
                </div>
            }/>
            <Route path="/" element={
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)}/>
                    <div className={`flex-1 ${sidebarWidth} pt-20`}>
                        <Navbar pageTitle="Dashboard"/>
                        <Dashboard/>
                    </div>
                </div>
            }/>
            <Route path="/staff" element={
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)}/>
                    <div className={`flex-1 ${sidebarWidth} pt-20`}>
                        <Navbar/>
                        <Staff/>
                    </div>
                </div>
            }/>
            <Route path="/datakamar" element={
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)}/>
                    <div className={`flex-1 ${sidebarWidth} pt-20`}>
                        <Navbar/>
                        <DataKamar/>
                    </div>
                </div>
            }/>
            <Route path="/statuskamar" element={
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)}/>
                    <div className={`flex-1 ${sidebarWidth} pt-20`}>
                        <Navbar/>
                        <StatusKamar/>
                    </div>
                </div>
            }/>
            <Route path="/riwayatpembersihan" element={
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)}/>
                    <div className={`flex-1 ${sidebarWidth} pt-20`}>
                        <Navbar/>
                        <RiwayatPembersihan/>
                    </div>
                </div>
            }/>
            <Route path="/pembagian-maintenance" element={
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)}/>
                    <div className={`flex-1 ${sidebarWidth} pt-20`}>
                        <Navbar/>
                        <PembagianMaintenance/>
                    </div>
                </div>
            }/>
            <Route path="/inventory" element={
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)}/>
                    <div className={`flex-1 ${sidebarWidth} pt-20`}>
                        <Navbar/>
                        <Inventory/>
                    </div>
                </div>
            }/>
            <Route path="/logs-kamar" element={
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)}/>
                    <div className={`flex-1 ${sidebarWidth} pt-20`}>
                        <Navbar pageTitle="Logs Kamar"/>
                        <LogsKamar/>
                    </div>
                </div>
            }/>
        </Routes>
    )
}

export default App;