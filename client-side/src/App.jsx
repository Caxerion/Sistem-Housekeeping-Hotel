import Navbar from "./components/Navbar";
import { Routes, Route } from "react-router-dom";
import Beranda from "./pages/Beranda";
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
            <Route path="/" element={<><Navbar/><Beranda/></>}/>
            <Route path="/datapetugas" element={<><Navbar/><DataPetugas/></>}/>
            <Route path="/datakamar" element={<><Navbar/><DataKamar/></>}/>
            <Route path="/statuskamar" element={<><Navbar/><StatusKamar/></>}/>
            <Route path="/riwayatpembersihan" element={<><Navbar/><RiwayatPembersihan/></>}/>
            <Route path="/inventory" element={<><Navbar/><Inventory/></>}/>
        </Routes>
    )
}

export default App;