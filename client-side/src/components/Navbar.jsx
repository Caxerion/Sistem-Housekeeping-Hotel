import { useState, useRef, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Gear = ({ className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);

// Menu yang sama persis dengan Sidebar.jsx
const menuItems = [
  { label: 'Dashboard', to: '/dashboard', icon: 'fa-solid fa-chart-area' },
  { label: 'Staff', to: '/staff', icon: 'fa-solid fa-user' },
  {
    label: 'Kamar',
    icon: 'fa-solid fa-bed',
    children: [
      { label: 'Status Kamar', to: '/statuskamar', icon: 'fa-solid fa-door-open' },
      { label: 'Pembagian Maintenance', to: '/pembagian-maintenance', icon: 'fa-solid fa-tools' },
      { label: 'Logs Kamar', to: '/logs-kamar', icon: 'fa-solid fa-file-lines' },
    ],
  },
  { label: 'Riwayat Kebersihan', to: '/riwayat-pembersihan', icon: 'fa-solid fa-broom' },
  { label: 'Inventory', to: '/inventory', icon: 'fa-solid fa-box' },
];

function Navbar({ pageTitle = 'Housekeeping' }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mobileOpenDropdown, setMobileOpenDropdown] = useState(null);
  const profileRef = useRef(null);
  const userMenuRef = useRef(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMobileDropdown = (label) => {
    setMobileOpenDropdown(mobileOpenDropdown === label ? null : label);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setMobileOpenDropdown(null);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-blue-600 shadow-md">
      <div className="w-full pl-2 pr-4 sm:pl-10 sm:pr-6">
        <div className="h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-[38px] h-[38px] rounded-[9px] flex items-center justify-center text-[20px]" style={{ background: 'linear-gradient(135deg,#ffffff33,#ffffff11)' }}>
              <i className="fa-solid fa-hotel text-white/90"></i>
            </div>
            <div className="text-[15px] font-bold leading-[1.15] text-white">
              Housekeeping App<span className="block text-[11px] font-normal opacity-[0.85]">{pageTitle}</span>
            </div>
          </Link>

          {/* Right side: Profile + Gear */}
          <div className="hidden md:flex items-center gap-3">
             {/* Profile Avatar + Info */}
             <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-medium shrink-0">
                  {user?.employee_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-medium text-white truncate max-w-[60px] group-hover:max-w-[200px] transition-all duration-800">
                    {user?.username || 'User'}
                  </span>
                  <span className="text-xs text-white/70 truncate max-w-[60px] group-hover:max-w-[200px] group-hover:underline transition-all duration-800">
                    {user?.email || '-'}
                  </span>
                </div>
              </button>

              {/* Dropdown: View Profile & Log Out */}
              <div
                className={`absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-xl border border-gray-100 py-1 origin-top-right transition-all duration-200 ease-out ${
                  isUserMenuOpen
                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                }`}
              >
                <Link
                  to="/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <i className="fa-solid fa-user w-4 text-center text-gray-500"></i> View Profile
                </Link>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center"></i> Log Out
                </button>
              </div>
            </div>

            {/* Gear Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="text-white/90 hover:text-white p-2 rounded-md hover:bg-white/10 transition-colors"
                aria-label="Menu"
              >
                <Gear />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1">
                  <Link
                    to="/repository"
                    onClick={() => setIsProfileOpen(false)}
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <i className="fa-solid fa-moon"></i> Dark Mode
                  </Link>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket"></i> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden text-white p-2"
            aria-label="Buka menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile offcanvas-style panel */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 md:hidden flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
         <div className="flex items-center justify-between px-5 h-20 border-b border-gray-100 shrink-0">
          <h5 className="font-semibold text-gray-800">Grand Nusantara Hotel</h5>
          <button
            onClick={closeMobileMenu}
            className="text-gray-500 p-1"
            aria-label="Tutup menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Menu navigasi (sama seperti Sidebar.jsx) */}
          <nav className="px-3 py-3 flex flex-col gap-1">
            {menuItems.map((item) => {
              if (item.children) {
                const isOpen = mobileOpenDropdown === item.label;
                return (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleMobileDropdown(item.label)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <i className={`${item.icon} w-4 text-center text-gray-500`}></i>
                      <span className="flex-1 text-left">{item.label}</span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="pl-4">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            onClick={closeMobileMenu}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                                isActive
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`
                            }
                          >
                            <i className={`${child.icon} w-4 text-center`}></i>
                            <span>{child.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <i className={`${item.icon} w-4 text-center text-gray-500`}></i>
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Mobile Profile Section */}
          <div className="mt-2 px-5 pt-4 pb-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-medium">
                {user?.employee_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user?.employee_name || 'User'}
              </span>
            </div>
            <button
              onClick={() => {
                closeMobileMenu();
                logout();
              }}
              className="mt-2 w-full px-3 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 text-left"
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i> Log Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;