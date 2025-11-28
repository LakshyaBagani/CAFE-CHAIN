import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RestaurantService, { type Restaurant } from '../../services/restaurantService';
import { formatDate } from '../../utils/dateUtils';
import { showToast } from '../../utils/toast';
import {
  Clock,
  Truck,
  RefreshCw,
  Search,
  Coffee,
  Utensils,
  Megaphone,
  X,
  Upload,
  ArrowLeft
} from 'lucide-react';

interface Order {
  id: number;
  userId: number;
  totalPrice: number;
  status: string;
  paymentMethod: string;
  deliveryType: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    number?: string;
  };
  orderItems: {
    id: number;
    orderId: number;
    menuId: number;
    quantity: number;
    menu: {
      id: number;
      name: string;
      price: number;
      description: string;
      imageUrl: string;
      restoId: number;
    };
  }[];
}

const RestaurantOrders: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const restaurantService = RestaurantService.getInstance();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(() => {
    // Get today's date in local timezone, not UTC
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  
  // Add Menu Modal States
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    price: '',
    description: '',
    type: 'Veg',
    category: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isAddingMenu, setIsAddingMenu] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const [showAddOfferModal, setShowAddOfferModal] = useState(false);
  const [offerMenuName, setOfferMenuName] = useState('');
  const [offerDiscount, setOfferDiscount] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  const submitOffer = async () => {
    if (!restaurantId) return;
    if (!offerMenuName || !offerDiscount) {
      showToast('Enter menu name and discount', 'warning');
      return;
    }
    try {
      setSubmittingOffer(true);
      const resp = await axios.post(`http://localhost:3000/admin/resto/${restaurantId}/runAds`, {
        menuName: offerMenuName,
        discount: offerDiscount
      }, { withCredentials: true });
      if (resp.data?.success) {
        showToast('Offer created successfully', 'success');
        setShowAddOfferModal(false);
        setOfferMenuName('');
        setOfferDiscount('');
      } else {
        showToast(resp.data?.message || 'Failed to create offer', 'error');
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || error.message || 'Failed to create offer', 'error');
    } finally {
      setSubmittingOffer(false);
    }
  };

  useEffect(() => {
    fetchRestaurantAndOrders();
  }, [restaurantId]);


  const fetchRestaurantAndOrders = async (dateToUse?: string) => {
    try {
      setLoading(true);
      const dateForRequest = dateToUse || selectedDate;

      // Get restaurant info from cached data
      const restaurants = restaurantService.getCachedRestaurants();
      const foundRestaurant = restaurants.find(r => r.id === parseInt(restaurantId || '0'));
      
      if (foundRestaurant) {
        setRestaurant(foundRestaurant);
      }

      // Single optimized request
      const requestPayload = { date: dateForRequest };
      
      const response = await axios.post(`https://cafe-chain.onrender.com/admin/resto/${restaurantId}/orderHistory`, requestPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
        timeout: 10000
      });
      
      const data = response.data;
      
      if (data.success) {
        setOrders(data.orders || []);
        const { showToast } = await import('../../utils/toast');
        showToast(data.message || 'Orders loaded successfully', 'success');
      } else {
        setOrders([]);
        const { showToast } = await import('../../utils/toast');
        showToast(data.message || 'Failed to load orders', 'error');
      }
    } catch (error: any) {
      setOrders([]);
      const { showToast } = await import('../../utils/toast');
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };


  // Function to update order status
  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
      const response = await axios.post('https://cafe-chain.onrender.com/admin/order/changestatus', {
        orderId,
        status: newStatus
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });

      if (response.data.success) {
        const { showToast } = await import('../../utils/toast');
        showToast(`Order status updated to ${newStatus}!`, 'success');
        fetchRestaurantAndOrders();
      } else {
        const { showToast } = await import('../../utils/toast');
        showToast('Failed to update order status', 'error');
      }
    } catch (error: any) {
      const { showToast } = await import('../../utils/toast');
      showToast('Failed to update order status', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Function to handle adding menu item
  const handleAddMenuItem = async () => {
    if (!selectedImage) {
      const { showToast } = await import('../../utils/toast');
      showToast('Please fill all fields and select an image', 'warning');
      return;
    }

    try {
      setIsAddingMenu(true);
      
      const formData = new FormData();
      formData.append('name', newMenuItem.name);
      formData.append('price', newMenuItem.price);
      formData.append('description', newMenuItem.description);
      formData.append('type', newMenuItem.type);
      formData.append('category', newMenuItem.category);
      formData.append('image', selectedImage);

      const response = await axios.post(
        `https://cafe-chain.onrender.com/admin/resto/${restaurantId}/addMenu`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true
        }
      );

      if (response.data.success) {
        const { showToast } = await import('../../utils/toast');
        showToast('Menu item added successfully!', 'success');
        setShowAddMenuModal(false);
        setNewMenuItem({
          name: '',
          price: '',
          description: '',
          type: 'Veg',
          category: ''
        });
        setSelectedImage(null);
      } else {
        const { showToast } = await import('../../utils/toast');
        showToast('Failed to add menu item', 'error');
      }
    } catch (error: any) {
      const { showToast } = await import('../../utils/toast');
      showToast('Failed to add menu item', 'error');
    } finally {
      setIsAddingMenu(false);
    }
  };

  // OrderCard component for individual order display
  const OrderCard: React.FC<{ order: Order }> = ({ order }) => {

    return (
      <div className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-gray-900 text-base">Order #{order.id}</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            <div className="text-xs text-gray-600 flex gap-3">
              <span>{formatDate(order.createdAt)}</span>
              <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
            </div>
            <div className="mt-1">
              <p className="font-semibold text-gray-900 text-sm break-words whitespace-normal">{order.user.name}</p>
              <p className="text-xs text-gray-600 break-words whitespace-normal">{order.user.number || '—'}</p>
            </div>
          </div>
          <div className="text-right ml-4">
            <p className="text-xl font-bold text-amber-700">₹{order.totalPrice}</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Items:</p>
          <div className="space-y-3">
            {order.orderItems.slice(0, 2).map((item) => (
              <div key={item.id} className="flex items-center space-x-3 bg-gray-50 rounded-xl p-3">
                <img 
                  src={item.menu.imageUrl} 
                  alt={item.menu.name}
                  className="w-12 h-12 rounded-xl object-cover shadow-sm"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/32x32?text=No+Image';
                  }}
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 break-words whitespace-normal">{item.menu.name}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity} × ₹{item.menu.price}</p>
                </div>
                <span className="font-bold text-gray-900">₹{item.menu.price * item.quantity}</span>
              </div>
            ))}
            {order.orderItems.length > 2 && (
              <div className="text-center py-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl">
                <p className="text-sm font-medium text-gray-600">
                  +{order.orderItems.length - 2} more items
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-3 justify-end">
          {order.status.toLowerCase() === 'pending' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'preparing')}
              disabled={updatingOrderId === order.id}
              className={`text-sm py-2 px-4 rounded-xl font-medium transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 ${updatingOrderId === order.id ? 'bg-blue-400 cursor-not-allowed opacity-70' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              aria-busy={updatingOrderId === order.id}
            >
              {updatingOrderId === order.id ? (
                <span className="inline-flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></span>Updating…</span>
              ) : (
                'Preparing'
              )}
            </button>
          )}
          {order.status.toLowerCase() === 'preparing' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'prepared')}
              disabled={updatingOrderId === order.id}
              className={`text-sm py-2 px-4 rounded-xl font-medium transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-300 ${updatingOrderId === order.id ? 'bg-orange-400 cursor-not-allowed opacity-70' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}
              aria-busy={updatingOrderId === order.id}
            >
              {updatingOrderId === order.id ? (
                <span className="inline-flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/60 border-top-transparent rounded-full animate-spin"></span>Updating…</span>
              ) : (
                'Prepared'
              )}
            </button>
          )}
          {order.status.toLowerCase() === 'prepared' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'Delivered')}
              disabled={updatingOrderId === order.id}
              className={`text-sm py-2 px-4 rounded-xl font-medium transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300 ${updatingOrderId === order.id ? 'bg-green-400 cursor-not-allowed opacity-70' : 'bg-green-600 hover:bg-green-700 text-white'}`}
              aria-busy={updatingOrderId === order.id}
            >
              {updatingOrderId === order.id ? (
                <span className="inline-flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></span>Updating…</span>
              ) : (
                'Delivered'
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (order.user.email?.toLowerCase()?.includes(searchQuery.toLowerCase()) || false) ||
                         (order.user.number?.includes(searchQuery) || false);
    const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Render the full page immediately; only order lists show skeletons when loading

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-gray-700">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back</span>
          </button>
          <div className="font-bold">Restaurant Orders</div>
          <div className="w-10" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 md:mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4 sm:gap-6">
              <Link
                to="/admin/restaurants"
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors w-max"
                aria-label="Back to Restaurants"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Link>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-1 md:mb-2">
                  {restaurant?.name || 'Restaurant'} Orders
                </h1>
                <p className="text-gray-600 text-sm md:text-lg">Manage and track all orders for this restaurant</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 sm:justify-end w-full sm:w-auto">
              <Link
                to={`/admin/restaurants/${restaurantId}/menu`}
                className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                <Utensils className="h-4 w-4" />
                <span>Menu</span>
              </Link>
              <button
                onClick={() => setShowAddMenuModal(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                <Utensils className="h-4 w-4" />
                <span>Add Menu</span>
              </button>
              <button
                onClick={() => setShowAddOfferModal(true)}
                disabled={submittingOffer}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-emerald-400 disabled:to-green-500 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                <Megaphone className="h-4 w-4" />
                <span>{submittingOffer ? 'Submitting...' : 'Add Offer'}</span>
              </button>
              {/* Top refresh removed; moved to filter row */}
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email or number..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-gray-50 transition-all duration-200 hover:bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const newDate = e.target.value;
                setSelectedDate(newDate);
                fetchRestaurantAndOrders(newDate);
              }}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-gray-50 transition-all duration-200 hover:bg-white"
            />
            <button
              onClick={() => fetchRestaurantAndOrders(selectedDate)}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`${loading ? 'animate-spin' : ''} h-4 w-4`} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Showing orders for <span className="font-medium">{(() => { const [y,m,d] = selectedDate.split('-'); return `${d}/${m}/${y}`; })()}</span>
          </div>
        </div>

      {/* Add Offer Modal */}
      {showAddOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-gray-900">Add Offer</h3>
              </div>
              <button onClick={() => { if (!submittingOffer) { setShowAddOfferModal(false); setOfferMenuName(''); setOfferDiscount(''); } }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Menu Name</label>
                <input
                  type="text"
                  value={offerMenuName}
                  onChange={(e) => setOfferMenuName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Exact menu name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Discount (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={offerDiscount}
                  onChange={(e) => setOfferDiscount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="e.g. 20"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => { if (!submittingOffer) { setShowAddOfferModal(false); setOfferMenuName(''); setOfferDiscount(''); } }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={submittingOffer}
              >
                Cancel
              </button>
              <button
                onClick={submitOffer}
                className={`px-4 py-2 rounded-lg text-white ${submittingOffer ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                disabled={submittingOffer}
              >
                {submittingOffer ? 'Submitting...' : 'Submit Offer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders List - 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Orders Column */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-yellow-800">Pending Orders</h3>
              <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                {filteredOrders.filter(order => order.status.toLowerCase() === 'pending').length}
              </span>
            </div>
            <p className="text-sm text-yellow-700 font-medium">Orders waiting to be processed</p>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={`pending-skel-${i}`} className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-5 animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2">
                      <div className="h-4 w-28 bg-gray-200 rounded" />
                      <div className="h-3 w-40 bg-gray-200 rounded" />
                      <div className="h-3 w-24 bg-gray-200 rounded" />
                    </div>
                    <div className="h-5 w-16 bg-gray-200 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-12 bg-gray-100 rounded-xl" />
                    <div className="h-12 bg-gray-100 rounded-xl" />
                  </div>
                </div>
              ))
            ) : (
              <>
                {filteredOrders.filter(order => order.status.toLowerCase() === 'pending').map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {filteredOrders.filter(order => order.status.toLowerCase() === 'pending').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No pending orders</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Preparing Orders Column */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                <Coffee className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-blue-800">Preparing</h3>
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                {filteredOrders.filter(order => order.status === 'preparing').length}
              </span>
            </div>
            <p className="text-sm text-blue-700 font-medium">Orders being prepared</p>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={`preparing-skel-${i}`} className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-5 animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2">
                      <div className="h-4 w-28 bg-gray-200 rounded" />
                      <div className="h-3 w-40 bg-gray-200 rounded" />
                      <div className="h-3 w-24 bg-gray-200 rounded" />
                    </div>
                    <div className="h-5 w-16 bg-gray-200 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-12 bg-gray-100 rounded-xl" />
                    <div className="h-12 bg-gray-100 rounded-xl" />
                  </div>
                </div>
              ))
            ) : (
              <>
                {filteredOrders.filter(order => order.status === 'preparing').map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {filteredOrders.filter(order => order.status === 'preparing').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Coffee className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No orders being prepared</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Prepared Orders Column */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-green-800">Prepared</h3>
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                {filteredOrders.filter(order => order.status === 'prepared').length}
              </span>
            </div>
            <p className="text-sm text-green-700 font-medium">Completed orders</p>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={`prepared-skel-${i}`} className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-5 animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2">
                      <div className="h-4 w-28 bg-gray-200 rounded" />
                      <div className="h-3 w-40 bg-gray-200 rounded" />
                      <div className="h-3 w-24 bg-gray-200 rounded" />
                    </div>
                    <div className="h-5 w-16 bg-gray-200 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-12 bg-gray-100 rounded-xl" />
                    <div className="h-12 bg-gray-100 rounded-xl" />
                  </div>
                </div>
              ))
            ) : (
              <>
                {filteredOrders.filter(order => order.status === 'prepared').map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {filteredOrders.filter(order => order.status === 'prepared').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Truck className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No prepared orders</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Removed global empty state - show per-column empty messages only */}

      {/* Add Menu Modal */}
      {showAddMenuModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Menu Item - {restaurant?.name}
              </h3>
              <button
                onClick={() => setShowAddMenuModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAddMenuItem(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={newMenuItem.name}
                  onChange={(e) => setNewMenuItem(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Enter item name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={newMenuItem.price}
                  onChange={(e) => setNewMenuItem(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Enter price"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newMenuItem.description}
                  onChange={(e) => setNewMenuItem(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Enter description"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={newMenuItem.type}
                    onChange={(e) => setNewMenuItem(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newMenuItem.category}
                    onChange={(e) => setNewMenuItem(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Roll">Roll</option>
                    <option value="Burger">Burger</option>
                    <option value="Sandwich">Sandwich</option>
                    <option value="Omelette">Omelette</option>
                    <option value="Maggie">Maggie</option>
                    <option value="Mocktail">Mocktail</option>
                    <option value="Fries">Fries</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-amber-600 hover:text-amber-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                          className="sr-only"
                          required
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    {selectedImage && (
                      <div className="mt-2">
                        <p className="text-sm text-green-600 mb-2">Selected: {selectedImage.name}</p>
                        <img 
                          src={URL.createObjectURL(selectedImage)} 
                          alt="Preview" 
                          className="mx-auto h-24 w-24 object-cover rounded-lg border border-gray-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMenuModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingMenu}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isAddingMenu ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Utensils className="h-4 w-4" />
                      <span>Add Menu Item</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default RestaurantOrders;
