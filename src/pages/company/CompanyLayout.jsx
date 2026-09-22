import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Brain, LayoutDashboard, FileText, Sparkles, AlertTriangle, Users, BarChart3, Settings, LogOut, Bell, Search, Menu, X, ChevronLeft, Upload } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/company', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, exact: true },
  { path: '/company/tickets', label: 'All Tickets', icon: <FileText className="w-5 h-5" /> },
  { path: '/company/ai-analysis', label: 'AI Analysis', icon: <Sparkles className="w-5 h-5" /> },
  { path: '/company/dataset-upload', label: 'Dataset Upload', icon: <Upload className="w-5 h-5" /> },
  { path: '/company/alerts', label: 'Emergency Alerts', icon: <AlertTriangle className="w-5 h-5" /> },
  { path: '/company/analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
];

export default function CompanyLayout() {
  const { user, logout, notifications, emergencyAlerts } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const activeEmergencies = emergencyAlerts.length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 fixed inset-y-0 z-30">
        <div className="p-5 border-b border-gray-100">
          <Link to="/company" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-brand-500 to-accent-cyan flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold gradient-text">SmartTicket AI</div>
              <div className="text-[10px] text-gray-400">Support Console</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(item.path, item.exact)
                  ? 'bg-gradient-to-r from-brand-50 to-cyan-50 text-brand-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              {item.label}
              {item.path === '/company/alerts' && activeEmergencies > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold blink">
                  {activeEmergencies}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.data?.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{user?.data?.name}</div>
              <div className="text-xs text-gray-500 truncate">{user?.data?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl animate-slide-in">
            <div className="p-4 flex items-center justify-between border-b border-gray-100">
              <Link to="/company" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-brand-500 to-accent-cyan flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold gradient-text">SmartTicket AI</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <nav className="p-3 space-y-1">
              {navItems.map(item => (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.path, item.exact) ? 'bg-brand-50 text-brand-700' : 'text-gray-600'
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-3">
              <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search tickets, customers..." className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative text-gray-500 hover:text-brand-600 transition-colors">
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {unreadNotifs}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.data?.avatar}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user?.data?.name}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
