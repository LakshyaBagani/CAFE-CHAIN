import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Coffee, Utensils, Menu, X, ArrowLeft, LogOut } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import { useAuth } from '../../context/AuthContext';

const Services: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleRestaurantClick = () => {
    navigate('/admin/restaurants');
  };

  const handleMealClick = () => {
    navigate('/admin/meals');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
          <div className="flex-1 md:ml-64">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-gray-700">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back</span>
            </button>
            <div className="font-bold">Admin - Services</div>
            <button onClick={() => setMobileMenuOpen(true)} className="text-gray-700">
              <Menu className="h-6 w-6" />
            </button>
          </div>
          {mobileMenuOpen && (
            <>
              <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setMobileMenuOpen(false)} />
              <div className="fixed top-0 right-0 h-full w-72 bg-white shadow-xl z-50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-bold">Menu</div>
                  <button onClick={() => setMobileMenuOpen(false)}><X className="h-6 w-6" /></button>
                </div>
                <nav className="space-y-2">
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">Dashboard</Link>
                  <Link to="/admin/services" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">Services</Link>
                  <Link to="/admin/analytics" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">Analytics</Link>
                  <Link to="/admin/delivered-orders" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">Delivered Orders</Link>
                  <Link to="/admin/users" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-100">Users</Link>
                  <button onClick={() => { setMobileMenuOpen(false); logout(); navigate('/login'); }} className="w-full flex items-center justify-start space-x-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50"><LogOut className="h-5 w-5" /><span>Logout</span></button>
                </nav>
              </div>
            </>
          )}
        </div>
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Services</h1>
            <p className="text-gray-600">Manage your services and offerings</p>
          </div>

          {/* Services Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Restaurant Option */}
            <div
              onClick={handleRestaurantClick}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-lg hover:border-amber-500 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <Coffee className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Restaurant</h2>
              <p className="text-gray-600 mb-4">
                Manage restaurants, menus, orders, and analytics for your restaurant chain
              </p>
              <div className="flex items-center text-amber-600 font-semibold group-hover:text-amber-700">
                <span>Manage Restaurants</span>
                <svg
                  className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>

            {/* Meal Option */}
            <div
              onClick={handleMealClick}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-lg hover:border-blue-500 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <Utensils className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Meal</h2>
              <p className="text-gray-600 mb-4">
                Manage meal plans, subscriptions, and meal-related services
              </p>
              <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                <span>Manage Meals</span>
                <svg
                  className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;

