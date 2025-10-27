import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Coffee, 
  DollarSign, 
  TrendingUp,
  Clock,
  Star,
  Eye,
  BarChart3,
  ShoppingBag,
  LogOut
} from 'lucide-react';
import { CalendarDays } from 'lucide-react';


interface DashboardStats {
  totalRestaurants: number;
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  todayOrders: number;
  todayRevenue: number;
}

const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
    todayOrders: 0,
    todayRevenue: 0
  });
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsFetching(true);
      // Fetch dashboard stats from backend (live data)
      const resp = await fetch('https://cafe-chain.onrender.com/admin/dashboard/stats', { cache: 'no-store' });
      const data = await resp.json();
      if (data.success) {
        const restaurantsFromApi = data.data.restaurants || [];
        setRestaurants(restaurantsFromApi.map((r: any) => ({
          id: r.id,
          name: r.name,
          location: r.location,
          number: r.number,
          createdAt: '',
          totalOrders: r.totalOrders,
          totalRevenue: r.totalRevenue,
          rating: 4.2,
          isActive: true
        })));
        setStats({
          totalRestaurants: restaurantsFromApi.length,
          totalOrders: data.data.monthly.totalOrders,
          totalRevenue: data.data.monthly.totalRevenue,
          averageRating: restaurantsFromApi.length > 0 ? 4.2 : 0,
          todayOrders: data.data.today.totalOrders,
          todayRevenue: data.data.today.totalRevenue
        });
        
        // Show success toast
        const { showToast } = await import('../../utils/toast');
        showToast('Dashboard data loaded successfully!', 'success');
      } else {
        // Show error toast for API error
        const { showToast } = await import('../../utils/toast');
        showToast('Failed to load dashboard data', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Show error toast for network error
      const { showToast } = await import('../../utils/toast');
      showToast('Network error. Failed to load dashboard data.', 'error');
    } finally {
      setIsFetching(false);
    }
  };

  // We always render dummy immediately; show skeleton shimmer over sections while fetching live data

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your restaurant chain operations</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${isFetching ? 'animate-pulse' : ''}`}>
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Coffee className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Restaurants</p>
              {isFetching ? (
                <div className="h-7 w-16 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.totalRestaurants}</p>
              )}
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${isFetching ? 'animate-pulse' : ''}`}>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">This Month Orders</p>
              {isFetching ? (
                <div className="h-7 w-20 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              )}
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${isFetching ? 'animate-pulse' : ''}`}>
          <div className="flex items-center">
            <div className="p-3 bg-amber-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">This Month Revenue</p>
              {isFetching ? (
                <div className="h-7 w-24 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${isFetching ? 'animate-pulse' : ''}`}>
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Rating</p>
              {isFetching ? (
                <div className="h-7 w-14 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${isFetching ? 'animate-pulse' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Orders</h3>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex items-center space-x-4">
            {isFetching ? (
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-bold text-green-600">{stats.todayOrders}</div>
            )}
            <div className="text-sm text-gray-500">
              <span className="text-green-600">+12%</span> from yesterday
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${isFetching ? 'animate-pulse' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Revenue</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex items-center space-x-4">
            {isFetching ? (
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-bold text-amber-600">₹{stats.todayRevenue}</div>
            )}
            <div className="text-sm text-gray-500">
              <span className="text-green-600">+8%</span> from yesterday
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/restaurants"
            className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Coffee className="h-6 w-6 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Manage Restaurants</p>
              <p className="text-sm text-blue-600">Add, edit, or remove restaurants</p>
            </div>
          </Link>

          {/* Removed View Orders quick link */}

          <Link
            to="/admin/analytics"
            className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <BarChart3 className="h-6 w-6 text-purple-600" />
            <div>
              <p className="font-medium text-purple-900">Analytics</p>
              <p className="text-sm text-purple-600">View detailed reports</p>
            </div>
          </Link>

          <Link
            to="/admin/delivered-orders"
            className="flex items-center space-x-3 p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
          >
            <CalendarDays className="h-6 w-6 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900">Delivered Orders</p>
              <p className="text-sm text-amber-700">View daily delivered history</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Restaurants */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Restaurants Overview</h3>
            <Link
              to="/admin/restaurants"
              className="text-amber-600 hover:text-amber-500 font-medium"
            >
              View All
            </Link>
          </div>
        </div>

        <div className={`divide-y divide-gray-200`}>
          {isFetching ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-6">
                <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
            ))
          ) : (
            restaurants.slice(0, 5).map((restaurant) => (
            <div key={restaurant.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <Coffee className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{restaurant.name}</h4>
                    <p className="text-sm text-gray-600">{restaurant.location}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="font-semibold text-gray-900">{restaurant.totalOrders}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="font-semibold text-gray-900">₹{restaurant.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Average Rating</p>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-semibold text-gray-900">{restaurant.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <Link
                    to={`/admin/restaurants/${restaurant.id}`}
                    className="flex items-center space-x-1 text-amber-600 hover:text-amber-500"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">View</span>
                  </Link>
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
