import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Brain, Home, PlusCircle, FileText, LogOut, Menu, X, Bell } from 'lucide-react';
import { useState } from 'react';

export default function CustomerLayout() {
  const { user, logout, notifications } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/customer', label: 'Dashboard', icon: <Home className="w-4 h-4" />, exact: true },
    { path: '/customer/submit', label: 'Submit Ticket', icon: <PlusCircle className="w-4 h-4" /> },
    { path: '/customer/tickets', label: 'My Tickets', icon: <FileText className="w-4 h-4" /> },
  ];

  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-50/30">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
                {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <Link to="/customer" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-brand-500 to-accent-cyan flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold gradient-text hidden sm:inline">SmartTicket AI</span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.path, item.exact) ? 'bg-brand-100 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.data?.avatar}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user?.data?.name}</span>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {mobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-100 py-2 px-4 animate-slide-up">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenu(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                  isActive(item.path, item.exact) ? 'bg-brand-50 text-brand-600' : 'text-gray-600'
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 page-enter">
        <Outlet />
      </main>
    </div>
  );
}
