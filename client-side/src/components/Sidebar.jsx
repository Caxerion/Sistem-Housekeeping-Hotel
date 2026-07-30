import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { label: 'Dashboard', to: '/dashboard', icon: 'fa-solid fa-chart-area' },
  { label: 'Staff', to: '/staff', icon: 'fa-solid fa-user' },
  { label: 'Kamar', to: '/status-kamar', icon: 'fa-solid fa-bed' },
  { label: 'Inventory', to: '/inventory', icon: 'fa-solid fa-box' },
];

function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();

  return (
    <aside className={`fixed left-0 top-18 bottom-0 bg-blue-600 flex flex-col z-40 transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
      {/* Toggle button */}
      <button
        onClick={onToggle}
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

      {/* Menu */}
      <nav className="flex flex-col">
        {menuItems.map((item) => (
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
              {item.icon.startsWith('fa-') ? (
                <i className={item.icon}></i>
              ) : (
                item.icon
              )}
            </span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
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
