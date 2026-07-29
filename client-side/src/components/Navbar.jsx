import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <>
            <nav className="navbar bg-success fixed-top">
                <div className="container-fluid">
                    <Link className="navbar-brand" to="/">Hotel</Link>
                    <button 
                        className="navbar-toggler" 
                        type="button" 
                        data-bs-toggle="offcanvas" 
                        data-bs-target="#offcanvasNavbar" 
                        aria-controls="offcanvasNavbar" 
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div 
                        className="offcanvas offcanvas-end" 
                        tabIndex="-1" 
                        id="offcanvasNavbar" 
                        aria-labelledby="offcanvasNavbarLabel"
                    >
                        <div className="offcanvas-header">
                            <h5 className="offcanvas-title" id="offcanvasNavbarLabel">Hotel</h5>
                            <button 
                                type="button" 
                                className="btn-close" 
                                data-bs-dismiss="offcanvas" 
                                aria-label="Close"
                            ></button>
                        </div>
                        <div className="offcanvas-body">
                            <ul className="navbar-nav justify-content-end flex-grow-1 pe-3">
                                <li className="nav-item">
                                    <Link className="nav-link" aria-current="page" to="/">Beranda</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/DataPetugas">Data Petugas</Link>
                                </li>
                                <li className="nav-item dropdown">
                                    <Link className="nav-link dropdown-toggle" to="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        Kamar
                                    </Link>
                                    <ul className="dropdown-menu">
                                        <li><Link className="dropdown-item" to="/DataKamar">Data Kamar</Link></li>
                                        <li><Link className="dropdown-item" to="/StatusKamar">Status Kamar</Link></li>
                                    </ul>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/RiwayatPembersihan">Riwayat Pembersihan</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/Inventory">Inventory</Link>
                                </li>
                            </ul>
                            <form className="d-flex mt-3" role="search">
                                <input className="form-control me-2" type="search" placeholder="Search" aria-label="Search" />
                                <button className="btn btn-outline-success" type="submit">Search</button>
                            </form>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    )
}

export default Navbar;