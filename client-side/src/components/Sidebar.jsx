import { NavLink } from 'react-router-dom';

const menuItems = [
  { label: 'Dashboard', to: '/dashboard', icon: 'fa-solid fa-gauge' },
  { label: 'Staff', to: '/staff', icon: 'fa-solid fa-user' },
  { label: 'Kamar', to: '/status-kamar', icon: 'fa-solid fa-bed' },
  { label: 'Inventory', to: '/inventory', icon: 'fa-solid fa-box' },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-18 bottom-0 w-56 bg-blue-600 flex flex-col z-40">
      {/* Search box */}
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
              }`
            }
          >
            <span className="text-lg leading-none">
              {item.icon.startsWith('fa-') ? (
                <i className={item.icon}></i>
              ) : (
                item.icon
              )}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;