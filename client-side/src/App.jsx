import { useState } from 'react';
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import StatusKamar from "./pages/StatusKamar";
import RiwayatPembersihan from "./pages/RiwayatPembersihan";
import PembagianMaintenance from "./pages/PembagianMaintenance";
import StatusPembersihan from "./pages/StatusPembersihan";
import Penugasan from "./pages/Penugasan";
import PenugasanPembersihan from "./pages/PenugasanPembersihan";
import LogsKamar from "./pages/LogsKamar";
import Inventory from "./pages/Inventory";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Staff from './pages/Staff';
import EndAttendance from './pages/Endattendance';
import AbsensiLogs from './pages/AbsensiLogs';
import IzinForm from './pages/IzinForm';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './context/ProtectedRoutes';

function MaintenancePage() {
    return <PembagianMaintenance />;
}

function StatusPembersihanPage() {
    const storedUser = (() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    })();

    if (!storedUser?.current_role || storedUser.current_role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return <StatusPembersihan />;
}

function CleaningPage() {
    const storedUser = (() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    })();

    if (storedUser?.current_role === 'admin') {
        return <Navigate to="/status-pembersihan" replace />;
    }
    return <PenugasanPembersihan />;
}

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
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<Login/>}/>
                <Route path="/register" element={<Register/>}/>
                <Route path="/dashboard" element={routeLayout('Dashboard', <Dashboard/>)}/>
                <Route path="/" element={routeLayout('Dashboard', <Dashboard/>)}/>
                <Route path="/staff" element={routeLayout('Staff', <Staff/>)}/>
                <Route path="/statuskamar" element={routeLayout('Status Kamar', <StatusKamar/>)}/>
                <Route path="/pembagian-maintenance" element={routeLayout('Pembagian Maintenance', <MaintenancePage/>)}/>
                <Route path="/status-pembersihan" element={routeLayout('Status Pembersihan', <StatusPembersihanPage/>)}/>
                <Route path="/pembagian-pembersihan" element={routeLayout('Penugasan Pembersihan', <CleaningPage/>)}/>
                <Route path="/inventory" element={routeLayout('Inventory', <Inventory/>)}/>
                <Route path="/riwayatpembersihan" element={routeLayout('Riwayat Kebersihan', <RiwayatPembersihan/>)}/>
                <Route path="/logs-kamar" element={routeLayout('Logs Kamar', <LogsKamar/>)}/>
                <Route path="/attendance/end/:id" element={routeLayout('Akhiri Absensi', <EndAttendance/>)}/>
                <Route path="/absensi-logs" element={routeLayout('Log Absensi', <AbsensiLogs/>)}/>
                <Route path="/izin" element={routeLayout('Izin', <IzinForm/>)}/>
            </Routes>
        </AuthProvider>
    )
}

export default App;
