import { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const menuItems = [
  { label: 'Dashboard', to: '/dashboard', icon: 'fa-solid fa-chart-area' },
  { label: 'Staff', to: '/staff', icon: 'fa-solid fa-user' },
  {
    label: 'Kamar',
    icon: 'fa-solid fa-bed',
    children: [
      { label: 'Status Kamar', to: '/statuskamar', icon: 'fa-solid fa-door-open' },
      { label: 'Pembagian Maintenance', to: '/pembagian-maintenance', icon: 'fa-solid fa-tools' },
      { label: 'Status Pembersihan', to: '/status-pembersihan', icon: 'fa-solid fa-broom', roles: ['admin'] },
      { label: 'Penugasan Pembersihan', to: '/pembagian-pembersihan', icon: 'fa-solid fa-broom', roles: ['staff'] },
      { label: 'Logs Kamar', to: '/logs-kamar', icon: 'fa-solid fa-file-lines' },
    ],
  },
  { label: 'Riwayat Kebersihan', to: '/riwayatpembersihan', icon: 'fa-solid fa-broom' },
  { label: 'Inventory', to: '/inventory', icon: 'fa-solid fa-box' },
];

function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [collapsedPopover, setCollapsedPopover] = useState({ open: false, label: null, pos: null });
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const popoverRef = useRef(null);
  const profileMenuRef = useRef(null);

  const toggleDropdown = (label) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const toggleCollapsedPopover = (label, event) => {
    if (collapsedPopover.label === label) {
      setCollapsedPopover({ open: false, label: null, pos: null });
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setCollapsedPopover({
        open: true,
        label,
        pos: { top: rect.bottom + window.scrollY, left: rect.right + window.scrollX },
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setCollapsedPopover({ open: false, label: null, pos: null });
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (collapsedPopover.open || isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [collapsedPopover.open, isProfileMenuOpen]);

  const filteredMenuItems = menuItems.map((item) => {
    if (!item.children) return item;
    return {
      ...item,
      children: item.children.filter((child) =>
        !child.roles || child.roles.includes(user?.current_role)
      ),
    };
  });

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onMobileClose} />
      )}

      <aside className={`fixed left-0 top-18 bottom-0 rounded-r-xl flex flex-col z-40 transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${isDark ? 'bg-blue-900' : 'bg-blue-600'}`}>
      {/* Toggle button */}
      <button
         onClick={() => {
          setCollapsedPopover({ open: false, label: null, pos: null });
          onToggle();
        }}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-blue-600 hover:bg-gray-100 transition-colors z-50"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {collapsed ? (
            <polyline points="9 18 15 12 9 6" />
          ) : (
            <polyline points="15 18 9 12 15 6" />
          )}
        </svg>
      </button>

      {collapsed ? (
        <div className="p-2 flex justify-center">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
            G
          </div>
        </div>
      ) : (
        <div className="p-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white text-sm font-bold shrink-0">
            G
          </div>
          <div className="text-white truncate">
            <p className="text-sm font-semibold leading-tight">Grand Nusantara Hotel</p>
            <p className="text-[11px] text-white/70 leading-tight">Housekeeping</p>
          </div>
        </div>
      )}

      {/* Menu */}
      <nav className="flex flex-col overflow-y-auto mt-4">
        {filteredMenuItems.map((item) => {
          if (item.children) {
            const isOpen = openDropdown === item.label;
            return (
              <div key={item.label} className="relative">
                {/* Dropdown Toggle */}
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    if (collapsed) {
                      toggleCollapsedPopover(item.label, e);
                    } else {
                      toggleDropdown(item.label);
                    }
                  }}
                   className={`w-full flex items-center gap-3 px-6 py-3.5 text-sm font-medium border-l-4 border-transparent transition-colors ${
                     collapsed ? 'justify-center px-0' : ''
                   } ${isDark ? 'text-blue-100 hover:bg-blue-800 hover:text-white' : 'text-white/90 hover:bg-white/5 hover:text-white'}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="text-lg leading-none">
                    <i className={item.icon}></i>
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {/* Animated chevron */}
                      <svg
                        className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </>
                  )}
                </button>

                {/* Collapsed popover (shows Kamar children when sidebar is shrunk) */}
                {collapsed && collapsedPopover.open && collapsedPopover.label === item.label && (
                  <div
                    ref={popoverRef}
                    className={`fixed z-50 rounded-lg shadow-xl border py-1 min-w-[160px] popover-slide-in ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                    }`}
                    style={{
                      top: collapsedPopover.pos.top,
                      left: collapsedPopover.pos.left,
                    }}
                  >
                    {item.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        onClick={() => setCollapsedPopover({ open: false, label: null, pos: null })}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                            isActive
                              ? isDark ? 'bg-gray-700 text-blue-400' : 'bg-blue-50 text-blue-600'
                              : isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                          }`
                        }
                      >
                        <i className={child.icon}></i>
                        <span>{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}

                {/* Smooth dropdown sub-menu */}
                {!collapsed && (
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                     <div className={isDark ? 'bg-blue-800/50' : 'bg-blue-700/30'}>
                       {item.children.map((child) => (
                         <NavLink
                           key={child.to}
                           to={child.to}
                           className={({ isActive }) =>
                             `flex items-center gap-3 py-2.5 px-6 text-sm font-medium border-l-4 transition-colors ${
                               isActive
                                 ? isDark ? 'bg-blue-700 border-blue-400 text-white font-semibold' : 'bg-white/10 border-white text-white font-semibold'
                                 : isDark ? 'border-transparent text-blue-100 hover:bg-blue-700 hover:text-white' : 'border-transparent text-white/80 hover:bg-white/5 hover:text-white'
                             }`
                           }
                           style={{ paddingLeft: '3.5rem' }}
                         >
                           <span className="text-base leading-none">
                             <i className={child.icon}></i>
                           </span>
                           <span>{child.label}</span>
                         </NavLink>
                       ))}
                     </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3.5 text-sm font-medium border-l-4 transition-colors ${
                  isActive
                    ? isDark ? 'bg-blue-800 border-blue-400 text-white font-semibold' : 'bg-white/10 border-white text-white font-semibold'
                    : isDark ? 'border-transparent text-blue-100 hover:bg-blue-800 hover:text-white' : 'border-transparent text-white/90 hover:bg-white/5 hover:text-white'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <span className="text-lg leading-none">
                <i className={item.icon}></i>
              </span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Profile */}
      <div className={`mt-auto border-t ${isDark ? 'border-blue-800' : 'border-white/10'} ${collapsed ? 'p-2' : 'p-4'}`}>
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => !collapsed && setIsProfileMenuOpen((prev) => !prev)}
            className={`flex items-center gap-3 w-full rounded-md transition-colors ${collapsed ? 'justify-center' : ''} ${isDark ? 'hover:bg-blue-800/50' : 'hover:bg-white/10'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${isDark ? 'bg-blue-800 text-blue-100' : 'bg-white/20 text-white'}`}>
              {user?.employee_name?.[0]?.toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <div className="flex flex-col text-left min-w-0">
                <p className={`text-sm font-medium truncate ${isDark ? 'text-blue-50' : 'text-white'}`}>
                  {user?.employee_name || 'User'}
                </p>
                <p className={`text-xs truncate ${isDark ? 'text-blue-200' : 'text-white/70'}`}>
                  {user?.username || 'user@example.com'}
                </p>
                <p className={`text-xs truncate ${isDark ? 'text-blue-300' : 'text-white/60'}`}>
                  {user?.employee_position || '-'}
                </p>
              </div>
            )}
          </button>

          {/* Dropdown */}
          {!collapsed && isProfileMenuOpen && (
            <div
              className={`absolute left-full ml-2 top-1/2 -translate-y-[55%] w-48 rounded-lg shadow-xl border py-1 origin-left transition-all duration-200 ease-out ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
              }`}
            >
              <Link
                to="/profile"
                onClick={() => setIsProfileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <i className="fa-solid fa-user w-4 text-center"></i> Lihat Profil
              </Link>
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  logout();
                }}
                className={`flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm ${isDark ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'}`}
              >
                <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center"></i> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
      </aside>
    </>
  );
}

export default Sidebar;
