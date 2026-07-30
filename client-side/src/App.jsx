import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DataPetugas from "./pages/DataPetugas";
import DataKamar from "./pages/DataKamar";
import StatusKamar from "./pages/StatusKamar";
import RiwayatPembersihan from "./pages/RiwayatPembersihan";
import Inventory from "./pages/Inventory";
import Login from "./pages/Login";

function App () {
    return(
        <Routes>
            <Route path="/login" element={<Login/>}/>
            <Route path="/dashboard" element={
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar/>
                    <div className="flex-1 ml-56 pt-20">
                        <Navbar pageTitle="Dashboard"/>
                        <Dashboard/>
                    </div>
                </div>
            }/>
            <Route path="/" element={
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar/>
                    <div className="flex-1 ml-56 pt-20">
                        <Navbar pageTitle="Dashboard"/>
                        <Dashboard/>
                    </div>
                </div>
            }/>
            <Route path="/datapetugas" element={
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar/>
                    <div className="flex-1 ml-56 pt-20">
                        <Navbar/>
                        <DataPetugas/>
                    </div>
                </div>
            }/>
            <Route path="/datakamar" element={
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar/>
                    <div className="flex-1 ml-56 pt-20">
                        <Navbar/>
                        <DataKamar/>
                    </div>
                </div>
            }/>
            <Route path="/statuskamar" element={
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar/>
                    <div className="flex-1 ml-56 pt-20">
                        <Navbar/>
                        <StatusKamar/>
                    </div>
                </div>
            }/>
            <Route path="/riwayatpembersihan" element={
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar/>
                    <div className="flex-1 ml-56 pt-20">
                        <Navbar/>
                        <RiwayatPembersihan/>
                    </div>
                </div>
            }/>
            <Route path="/inventory" element={
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar/>
                    <div className="flex-1 ml-56 pt-20">
                        <Navbar/>
                        <Inventory/>
                    </div>
                </div>
            }/>
        </Routes>
    )
}

export default App;