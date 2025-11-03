import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Coffee, 
  BarChart3, 
  Settings,
  CalendarDays,
  LogOut,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/admin',
      icon: LayoutDashboard,
    },
    {
      name: 'Services',
      path: '/admin/services',
      icon: Settings,
    },
    {
      name: 'Restaurants',
      path: '/admin/restaurants',
      icon: Coffee,
    },
    {
      name: 'Analytics',
      path: '/admin/analytics',
      icon: BarChart3,
    },
    {
      name: 'Delivered Orders',
      path: '/admin/delivered-orders',
      icon: CalendarDays,
    },
    {
      name: 'Users',
      path: '/admin/users',
      icon: Users,
    },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm z-50" style={{ zIndex: 9999 }}>
      <div className="flex flex-col h-full">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">CafeChain</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-amber-600' : 'text-gray-500'}`} />
                <span className={`font-medium ${active ? 'text-amber-900' : ''}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;

