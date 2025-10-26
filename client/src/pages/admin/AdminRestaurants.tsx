import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import RestaurantService, { type Restaurant } from '../../services/restaurantService';
// import { useAuth } from '../../context/AuthContext';
import { 
  Coffee, 
  MapPin, 
  Phone, 
  Plus, 
  Power, 
  Star,
  Calendar,
  Search,
  Filter,
  ArrowLeft
} from 'lucide-react';


const AdminRestaurants: React.FC = () => {
  const navigate = useNavigate();
  // const { logout } = useAuth();
  const restaurantService = RestaurantService.getInstance();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    location: '',
    number: ''
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState<number | null>(null);
  const [dailyStats, setDailyStats] = useState<Record<number, { orderCount: number; totalRevenue: number; date: string }>>({});

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const restaurantsData = await restaurantService.getRestaurants();
      setRestaurants(restaurantsData);

      // Extract daily stats from the restaurant data (now included in the same response)
      const statsEntries = restaurantsData.map((r: any) => [
        r.id, 
        r.dailyStats || { orderCount: 0, totalRevenue: 0, date: new Date().toISOString().slice(0,10) }
      ] as const);
      setDailyStats(Object.fromEntries(statsEntries));
      
      // Show success toast
      const { showToast } = await import('../../utils/toast');
      showToast('Restaurants loaded successfully', 'success');
    } catch (error: any) {
      const { showToast } = await import('../../utils/toast');
      showToast('Failed to fetch restaurants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestaurant = async () => {
    if (!newRestaurant.name || !newRestaurant.location || !newRestaurant.number) {
      return;
    }

    setIsAdding(true);
    try {
      
      const response = await axios.post('https://cafe-chain.onrender.com/admin/createResto', newRestaurant, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });
      
      const data = response.data;
      
      if (data.success) {
        const { showToast } = await import('../../utils/toast');
        showToast('Restaurant added successfully!', 'success');
        // Navigate to admin dashboard after success
        navigate('/admin');
      } else {
        const { showToast } = await import('../../utils/toast');
        showToast(data.message || 'Failed to add restaurant', 'error');
        // Navigate to admin dashboard even after failure
        setTimeout(() => {
          navigate('/admin');
        }, 1500);
      }
    } catch (error: any) {
      const { showToast } = await import('../../utils/toast');
      showToast('Failed to add restaurant', 'error');
      // Navigate to admin dashboard even after error
      setTimeout(() => {
        navigate('/admin');
      }, 1500);
    } finally {
      setIsAdding(false);
    }
  };

  

  const handleChangeStatus = async (restaurant: Restaurant) => {
    try {
      setIsChangingStatus(restaurant.id);
      const newStatus = !restaurant.isActive;
      
      const response = await axios.post(`https://cafe-chain.onrender.com/admin/resto/${restaurant.id}/changeStatus`, {
        status: newStatus
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setRestaurants(prev => 
          prev.map(r => 
            r.id === restaurant.id 
              ? { ...r, isActive: newStatus }
              : r
          )
        );
        const { showToast } = await import('../../utils/toast');
        showToast(`Restaurant ${newStatus ? 'opened' : 'closed'} successfully!`, 'success');
      } else {
        const { showToast } = await import('../../utils/toast');
        showToast('Failed to change restaurant status', 'error');
      }
    } catch (error: any) {
      console.error('Failed to change status:', error);
      const { showToast } = await import('../../utils/toast');
      showToast(`Failed to change restaurant status: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setIsChangingStatus(null);
    }
  };




  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show skeleton grid while loading (no blank screen)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/** Format today's date as dd/mm/yyyy for display */}
      {(() => { return null; })()}
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Admin</span>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurants</h1>
            <p className="text-gray-600">Manage your restaurant locations</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Restaurant</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search restaurants..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Restaurants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                    <div>
                      <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                    </div>
                  </div>
                  <div className="h-5 w-16 bg-gray-200 rounded" />
                </div>
                <div className="space-y-3 mb-6">
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="h-6 bg-gray-200 rounded" />
                  <div className="h-6 bg-gray-200 rounded" />
                  <div className="h-6 bg-gray-200 rounded" />
                </div>
                <div className="flex space-x-2">
                  <div className="h-9 flex-1 bg-gray-200 rounded" />
                  <div className="h-9 flex-1 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))
        ) : (
        filteredRestaurants.map((restaurant) => (
          <div 
            key={restaurant.id} 
            onClick={() => navigate(`/admin/restaurants/${restaurant.id}/orders`)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md cursor-pointer hover:scale-105 transform transition-all duration-200"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <Coffee className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{restaurant.location}</span>
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  restaurant.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {restaurant.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{restaurant.number}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {(() => {
                      const d = new Date();
                      const dd = String(d.getDate()).padStart(2, '0');
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const yyyy = d.getFullYear();
                      return `${dd}/${mm}/${yyyy}`;
                    })()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{dailyStats[restaurant.id]?.orderCount ?? 0}</p>
                  <p className="text-xs text-gray-500">Orders (Today)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">₹{(dailyStats[restaurant.id]?.totalRevenue ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Revenue (Today)</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-bold text-gray-900">{restaurant.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-gray-500">Rating</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    handleChangeStatus(restaurant);
                  }}
                  disabled={isChangingStatus === restaurant.id}
                  className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-lg transition-colors ${
                    restaurant.isActive 
                      ? 'bg-red-50 hover:bg-red-100 text-red-700' 
                      : 'bg-green-50 hover:bg-green-100 text-green-700'
                  } ${isChangingStatus === restaurant.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Power className="h-4 w-4" />
                  <span className="text-sm">
                    {isChangingStatus === restaurant.id ? 'Changing...' : restaurant.isActive ? 'Close' : 'Open'}
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    navigate(`/admin/restaurants/${restaurant.id}/analytics`);
                  }}
                  className="flex-1 flex items-center justify-center space-x-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Analytics</span>
                </button>
              </div>
            </div>
          </div>
        ))
        )}
      </div>

      {filteredRestaurants.length === 0 && (
        <div className="text-center py-12">
          <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No restaurants found</h3>
          <p className="text-gray-500">Try adjusting your search or add a new restaurant</p>
        </div>
      )}

      {/* Add Restaurant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Restaurant</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={newRestaurant.name}
                  onChange={(e) => setNewRestaurant({...newRestaurant, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Enter restaurant name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={newRestaurant.location}
                  onChange={(e) => setNewRestaurant({...newRestaurant, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Enter location"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newRestaurant.number}
                  onChange={(e) => setNewRestaurant({...newRestaurant, number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRestaurant}
                disabled={isAdding}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  isAdding 
                    ? 'bg-amber-400 cursor-not-allowed' 
                    : 'bg-amber-500 hover:bg-amber-600'
                } text-white`}
              >
                {isAdding ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  'Add Restaurant'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminRestaurants;
