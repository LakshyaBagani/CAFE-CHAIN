import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { 
  Coffee, 
  DollarSign, 
  TrendingUp,
  Clock,
  Utensils,
  Eye,
  BarChart3,
  ShoppingBag,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { CalendarDays } from 'lucide-react';


interface DashboardStats {
  totalRestaurants: number;
  totalOrders: number;
  totalRevenue: number;
  mealRevenue: number;
  todayOrders: number;
  todayRevenue: number;
}

const AdminDashboard: React.FC = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
    mealRevenue: 0,
    todayOrders: 0,
    todayRevenue: 0
  });
  const [isFetching, setIsFetching] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

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
          rating: 0,
          isActive: true
        })));
        setStats({
          totalRestaurants: restaurantsFromApi.length,
          totalOrders: data.data.monthly.totalOrders,
          totalRevenue: data.data.monthly.totalRevenue,
          mealRevenue: 0,
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
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
          <div className="flex-1 md:ml-64">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="w-10" />
            <div className="font-bold">Admin Dashboard</div>
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
                  <button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} className="w-full flex items-center justify-start space-x-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50"><LogOut className="h-5 w-5" /><span>Logout</span></button>
                </nav>
              </div>
            </>
          )}
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your restaurant chain operations</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/admin/restaurants" className={`block bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${isFetching ? 'animate-pulse' : 'hover:shadow-md transition-shadow'}`}>
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
        </Link>

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
            <div className="p-3 bg-green-100 rounded-lg">
              <Utensils className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Meal Revenue</p>
              {isFetching ? (
                <div className="h-7 w-20 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">₹{stats.mealRevenue.toLocaleString()}</p>
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
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/services"
            className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Coffee className="h-6 w-6 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Manage Services</p>
              <p className="text-sm text-blue-600">Manage restaurants and meal services</p>
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
      </div>
    </div>
  );
};

export default AdminDashboard;
