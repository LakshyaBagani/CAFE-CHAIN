import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  LogOut,
  Package,
  Truck,
  CheckCircle
} from 'lucide-react';

const Profile: React.FC = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userInfoLoading, setUserInfoLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [userInfoError, setUserInfoError] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Helper functions for order status
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'preparing':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'prepared':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'prepared':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle authentication
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setRetryCount(0);
        // Use cached user info only; do not call userInfo API here
        await Promise.all([useCachedUserInfo(), fetchOrders()]);
      } catch (error) {
        console.error('Failed to load profile data:', error);
      }
    };
    loadProfileData();
  }, []);

  const useCachedUserInfo = async () => {
    try {
      setUserInfoError(null);
      // Prefer AuthContext cached user first
      const authCached = localStorage.getItem('auth_user');
      if (authCached) {
        try {
          setUserInfo(JSON.parse(authCached));
          setUserInfoLoading(false);
          return;
        } catch {}
      }
      // Fallback to profile cache (legacy)
      const cachedUserInfo = localStorage.getItem('userProfileInfo');
      if (cachedUserInfo) {
        try {
          setUserInfo(JSON.parse(cachedUserInfo));
        } catch {}
      }
    } finally {
      setUserInfoLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersError(null);
      const response = await fetch('http://localhost:3000/user/orderHistory', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
        const { showToast } = await import('../utils/toast');
        showToast('Orders loaded successfully', 'success');
      } else {
        setOrdersError('Failed to load order history');
        const { showToast } = await import('../utils/toast');
        showToast('Failed to load order history', 'error');
      }
    } catch (error) {
      setOrdersError('Network error. Please try again.');
      const { showToast } = await import('../utils/toast');
      showToast('Network error. Please try again.', 'error');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        logout();
        navigate('/');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const retryLoading = () => {
    setRetryCount(prev => prev + 1);
    setUserInfoLoading(true);
    setOrdersLoading(true);
    setUserInfoError(null);
    setOrdersError(null);
    
    const loadProfileData = async () => {
      try {
        await Promise.all([useCachedUserInfo(), fetchOrders()]);
      } catch (error) {
        console.error('Failed to load profile data:', error);
      }
    };
    
    loadProfileData();
  };

  // Memoize processed orders for better performance
  const processedOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    
    return orders.map(order => ({
      ...order,
      formattedDate: new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      totalItems: order.orderItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
    }));
  }, [orders]);

  // Show skeleton while authentication is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        {/* Back Button Skeleton */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-2 animate-pulse">
              <div className="h-5 w-5 bg-gray-300 rounded"></div>
              <div className="h-5 bg-gray-300 rounded w-24"></div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Profile Information Skeleton */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-orange-200 p-8 mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full animate-pulse">
                <div className="h-8 w-8 bg-gray-300 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-300 rounded w-48 animate-pulse"></div>
                <div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3 p-4 bg-orange-50 rounded-xl animate-pulse">
                  <div className="h-5 w-5 bg-gray-300 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                    <div className="h-5 bg-gray-300 rounded w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order History Skeleton */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-orange-200 p-8 mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full animate-pulse">
                <div className="h-8 w-8 bg-gray-300 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-300 rounded w-40 animate-pulse"></div>
                <div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div>
              </div>
            </div>

            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-orange-50 rounded-xl p-6 border border-orange-200 animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-5 w-5 bg-gray-300 rounded"></div>
                      <div className="h-5 bg-gray-300 rounded w-24"></div>
                    </div>
                    <div className="h-6 bg-gray-300 rounded w-16"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-24"></div>
                      <div className="h-5 bg-gray-300 rounded w-20"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-16"></div>
                      <div className="h-5 bg-gray-300 rounded w-12"></div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                    {Array.from({ length: 2 }).map((_, itemIndex) => (
                      <div key={itemIndex} className="flex justify-between items-center bg-white rounded-lg p-3">
                        <div className="h-4 bg-gray-300 rounded w-32"></div>
                        <div className="h-4 bg-gray-300 rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logout Button Skeleton */}
          <div className="text-center">
            <div className="flex items-center space-x-3 mx-auto px-8 py-4 bg-gray-200 rounded-xl w-32 h-12 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Back Button */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Home</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Information */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-orange-200 p-8 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile Information</h1>
              <p className="text-gray-600">Your account details</p>
            </div>
          </div>

          {userInfoLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3 p-4 bg-orange-50 rounded-xl animate-pulse">
                  <div className="h-5 w-5 bg-gray-300 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                    <div className="h-5 bg-gray-300 rounded w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : userInfoError ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">
                <User className="h-12 w-12 mx-auto mb-2" />
                <p className="text-lg font-semibold">Failed to load profile</p>
                <p className="text-sm text-gray-600">{userInfoError}</p>
              </div>
              <button
                onClick={retryLoading}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : userInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-xl">
                <User className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-semibold text-gray-900">{userInfo.name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-xl">
                <Mail className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{userInfo.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-xl">
                <Phone className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">{userInfo.number || 'Not provided'}</p>
                </div>
              </div>

              {/* Address removed as requested */}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3 p-4 bg-orange-50 rounded-xl animate-pulse">
                  <div className="h-5 w-5 bg-gray-300 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                    <div className="h-5 bg-gray-300 rounded w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order History */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-orange-200 p-8 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
              <p className="text-gray-600">Your recent orders</p>
            </div>
          </div>

          {ordersLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-orange-50 rounded-xl p-6 border border-orange-200 animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-5 w-5 bg-gray-300 rounded"></div>
                      <div className="h-5 bg-gray-300 rounded w-24"></div>
                    </div>
                    <div className="h-6 bg-gray-300 rounded w-16"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-24"></div>
                      <div className="h-5 bg-gray-300 rounded w-20"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-16"></div>
                      <div className="h-5 bg-gray-300 rounded w-12"></div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                    {Array.from({ length: 2 }).map((_, itemIndex) => (
                      <div key={itemIndex} className="flex justify-between items-center bg-white rounded-lg p-3">
                        <div className="h-4 bg-gray-300 rounded w-32"></div>
                        <div className="h-4 bg-gray-300 rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : ordersError ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">
                <Package className="h-12 w-12 mx-auto mb-2" />
                <p className="text-lg font-semibold">Failed to load orders</p>
                <p className="text-sm text-gray-600">{ordersError}</p>
              </div>
              <button
                onClick={retryLoading}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : processedOrders.length > 0 ? (
            <div className="space-y-4">
              {processedOrders.map((order: any) => {
                const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={order.id} className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(order.status)}
                        <span className="font-semibold text-gray-900">
                          Order #{order.id}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-orange-600">
                          ₹{order.totalPrice}
                        </span>
                        <div className="mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Order Date */}
                    <div className="mb-4">
                      <div className="text-sm text-gray-600">
                        <div className="font-medium">Date: {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Time: {new Date(order.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Show ordered items */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Order Items</p>
                      <div className="space-y-2">
                        {(order.orderItems || []).map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center bg-white rounded-lg p-3">
                            <span className="font-medium text-gray-900">{item.menu?.name}</span>
                            <span className="text-orange-600 font-semibold">Qty: {item.quantity}</span>
                          </div>
                        ))}
                        {(!order.orderItems || order.orderItems.length === 0) && (
                          <div className="text-sm text-gray-500">No items found for this order.</div>
                        )}
                      </div>
                    </div>

                    {/* Track Order Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => navigate(`/track-order/${order.id}`)}
                        className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                      >
                        <Truck className="h-4 w-4" />
                        <span>Track Order</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No orders found</p>
              <p className="text-sm text-gray-500">Your order history will appear here</p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="text-center">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex items-center space-x-3 mx-auto px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <LogOut className="h-5 w-5" />
            <span>{loading ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
