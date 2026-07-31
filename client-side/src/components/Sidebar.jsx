import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { label: 'Dashboard', to: '/dashboard', icon: 'fa-solid fa-chart-area' },
  { label: 'Staff', to: '/staff', icon: 'fa-solid fa-user' },
  {
    label: 'Kamar',
    icon: 'fa-solid fa-bed',
    children: [
      { label: 'Status Kamar', to: '/statuskamar', icon: 'fa-solid fa-door-open' },
      { label: 'Pembagian Maintenance', to: '/pembagian-maintenance', icon: 'fa-solid fa-tools' },
    ],
  },
  { label: 'Riwayat Kebersihan', to: '/riwayat-pembersihan', icon: 'fa-solid fa-broom'},
  { label: 'Inventory', to: '/inventory', icon: 'fa-solid fa-box' },
];

function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [collapsedPopover, setCollapsedPopover] = useState({ open: false, label: null, pos: null });
  const popoverRef = useRef(null);

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
    };
    if (collapsedPopover.open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [collapsedPopover.open]);

  return (
    <aside className={`fixed left-0 top-18 bottom-0 bg-blue-600 flex flex-col z-40 transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
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
          <button
            type="button"
            title="Search"
            onClick={() => setSearchOpen(true)}
            className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white/80 hover:bg-white/25 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-center gap-2 bg-white/15 rounded-full px-4 py-2.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white/80"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              placeholder="Search"
              aria-label="Search"
              className="bg-transparent text-white placeholder-white/70 text-sm outline-none w-full"
            />
          </div>
        </div>
      )}

      {/* Search overlay (appears when search icon clicked while collapsed) */}
      {searchOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-18"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 mt-4"
            onClick={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSearchOpen(false);
              }}
              className="flex items-center p-3 gap-2"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-400"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                placeholder="Search..."
                autoFocus
                className="flex-1 outline-none text-gray-800 text-sm"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-lg"
              >
                ×
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Menu */}
      <nav className="flex flex-col overflow-y-auto">
        {menuItems.map((item) => {
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
                  className={`w-full flex items-center gap-3 px-6 py-3.5 text-sm font-medium border-l-4 border-transparent text-white/90 hover:bg-white/5 hover:text-white transition-colors ${
                    collapsed ? 'justify-center px-0' : ''
                  }`}
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
                    className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-100 py-1 min-w-[160px] popover-slide-in"
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
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-50'
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
                      isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="bg-blue-700/30">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          className={({ isActive }) =>
                            `flex items-center gap-3 py-2.5 px-6 text-sm font-medium border-l-4 transition-colors ${
                              isActive
                                ? 'bg-white/10 border-white text-white font-semibold'
                                : 'border-transparent text-white/80 hover:bg-white/5 hover:text-white'
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
                    ? 'bg-white/10 border-white text-white font-semibold'
                    : 'border-transparent text-white/90 hover:bg-white/5 hover:text-white'
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
      <div className={`mt-auto border-t border-white/10 ${collapsed ? 'p-2' : 'p-4'}`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-medium shrink-0">
            {user?.employee_name?.[0]?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.employee_name || 'User'}
              </p>
              <p className="text-xs text-white/70 truncate">
                {user?.username || 'user@example.com'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
