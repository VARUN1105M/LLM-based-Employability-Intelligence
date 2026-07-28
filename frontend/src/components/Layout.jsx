import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Map,
  MessageSquare,
  LogOut,
  User as UserIcon,
  Menu,
  X
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Resume Analyzer', href: '/resume', icon: FileText },
    { name: 'Assessments', href: '/assessments', icon: CheckSquare },
    { name: 'Roadmap', href: '/roadmap', icon: Map },
    { name: 'AI Counselor', href: '/chat', icon: MessageSquare },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Menu Bar */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-20">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center font-bold text-white text-sm">
            AT
          </div>
          <span className="font-semibold text-lg text-white">Career Intelligence</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out bg-slate-900 border-r border-slate-800/80 w-64 flex flex-col justify-between z-30`}
      >
        <div className="flex flex-col h-full pt-5 pb-4 overflow-y-auto">
          {/* Logo Header */}
          <div className="flex items-center px-6 mb-8 space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <span className="text-white font-extrabold text-lg">AT</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-none">ATIA Platform</h1>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Employability AI</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-2 flex-1 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-600/20 to-indigo-600/10 border border-primary-500/30 text-primary-400 shadow-lg shadow-primary-500/5'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-primary-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {user?.profile_image ? (
                <img
                  className="h-10 w-10 rounded-full object-cover border border-slate-700"
                  src={user.profile_image}
                  alt={user.full_name}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-slate-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-none mb-1">
                  {user?.full_name || 'Loading...'}
                </p>
                <p className="text-[11px] text-slate-400 truncate leading-none capitalize">
                  {user?.role || 'student'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 z-10 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
