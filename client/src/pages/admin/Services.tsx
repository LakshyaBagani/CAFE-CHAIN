import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Utensils } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';

const Services: React.FC = () => {
  const navigate = useNavigate();

  const handleRestaurantClick = () => {
    navigate('/admin/restaurants');
  };

  const handleMealClick = () => {
    // Navigate to meal management page when implemented
    // For now, just show a message
    alert('Meal management feature coming soon!');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 ml-64">
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

