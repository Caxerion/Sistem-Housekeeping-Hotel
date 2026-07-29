import Navbar from "./components/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Beranda from "./pages/Beranda";
import DataPetugas from "./pages/DataPetugas";
import DataKamar from "./pages/DataKamar";
import StatusKamar from "./pages/StatusKamar";
import RiwayatPembersihan from "./pages/RiwayatPembersihan";
import Inventory from "./pages/Inventory";

function App () {
    return(
        <BrowserRouter>
        <Navbar/>
        <Routes>
            <Route path="/" element={<Beranda/>}/>
            <Route path="/datapetugas" element={<DataPetugas/>}/>
            <Route path="/datakamar" element={<DataKamar/>}/>
            <Route path="/statuskamar" element={<StatusKamar/>}/>
            <Route path="/riwayatpembersihan" element={<RiwayatPembersihan/>}/>
            <Route path="/inventory" element={<Inventory/>}/>
        </Routes>
        </BrowserRouter>
    )
}

export default App;