import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
// Link removed - not used
import AdminSidebar from '../../components/AdminSidebar';
import { Calendar, IndianRupee, PackageCheck } from 'lucide-react';

interface DeliveredOrderItem {
  id: number;
  quantity: number;
  menu: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
  };
}

interface DeliveredOrder {
  id: number;
  totalPrice: number;
  createdAt: string;
  status: string;
  orderItems: DeliveredOrderItem[];
  user: { id: number; name: string; email: string; number?: string };
}

interface Restaurant {
  id: number;
  name: string;
  location: string;
}

const AdminDeliveredOrders: React.FC = () => {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [orders, setOrders] = useState<DeliveredOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestoId, setSelectedRestoId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // Fetch restaurants dynamically from API
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await axios.get('https://cafe-chain.onrender.com/admin/allResto', {
          withCredentials: true
        });
        if (response.data?.success && response.data?.resto) {
          const restos = response.data.resto.map((r: any) => ({
            id: r.id,
            name: r.name,
            location: r.location
          }));
          setRestaurants(restos);
          
          // Set selected restaurant
          const params = new URLSearchParams(window.location.search);
          const paramRestoId = params.get('restoId');
          if (paramRestoId && restos.find((r: Restaurant) => r.id === parseInt(paramRestoId))) {
            setSelectedRestoId(parseInt(paramRestoId));
          } else if (restos.length > 0) {
            setSelectedRestoId(restos[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
        // Fallback to localStorage cache if API fails
        try {
          const cached = localStorage.getItem('allResto_cache');
          if (cached) {
            const restos = JSON.parse(cached);
            setRestaurants(restos);
            if (restos.length > 0) {
              setSelectedRestoId(restos[0].id);
            }
          }
        } catch {}
      }
    };
    fetchRestaurants();
  }, []);

  const fetchDelivered = async () => {
    if (!selectedRestoId) return;
    setLoading(true);
    try {
      const resp = await axios.post(`https://cafe-chain.onrender.com/admin/resto/${selectedRestoId}/deliveredOrders`, { date });
      if (resp.data?.success) {
        setOrders(resp.data.orders || []);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error('Failed to fetch delivered orders', e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDelivered();
  }, [selectedRestoId, date]);

  const totalRevenue = useMemo(() => orders.reduce((s, o) => s + o.totalPrice, 0), [orders]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 mb-8 border border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivered Orders</h1>
            <p className="text-amber-700">View and track completed orders</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-amber-700 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant</label>
            <select
              value={selectedRestoId ?? ''}
              onChange={(e) => setSelectedRestoId(parseInt(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all duration-200 relative z-50"
              style={{ zIndex: 9999 }}
            >
              {restaurants.length === 0 ? (
                <option value="">Loading restaurants...</option>
              ) : (
                restaurants.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))
              )}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-3">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {(() => { const [y,m,d] = date.split('-'); return `${d}/${m}/${y}`; })()}
            </div>
            <div className="text-sm text-gray-600">Selected Date</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mx-auto mb-3">
              <PackageCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
            <div className="text-sm text-gray-600">Delivered Orders</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl mx-auto mb-3">
              <IndianRupee className="w-6 h-6 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">₹{totalRevenue}</div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
        </div>
      </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 h-80 flex flex-col animate-pulse">
                      {/* Header Skeleton */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                          <div>
                            <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="h-6 bg-gray-200 rounded w-16 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>

                      {/* Items Skeleton */}
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="space-y-2 flex-1 overflow-hidden">
                          {[...Array(2)].map((_, itemIndex) => (
                            <div key={itemIndex} className="flex items-center gap-3 p-2 bg-gray-100 rounded-lg">
                              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                              <div className="flex-1 min-w-0">
                                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                              </div>
                              <div className="h-3 bg-gray-200 rounded w-10"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
        <div className="text-center text-gray-600">No delivered orders for the selected day.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 group h-80 flex flex-col"
                    >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <PackageCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">{order.user?.name || 'User'}</div>
                    <div className="text-xs text-gray-500">
                      {order.user?.number || 'No number'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-600">₹{order.totalPrice}</div>
                  <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Delivered
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="flex-1 flex flex-col">
                <div className="space-y-3 flex-1 overflow-hidden">
                  {order.orderItems.slice(0, expanded[order.id] ? order.orderItems.length : 3).map((oi) => (
                    <div key={oi.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <img
                        src={oi.menu.imageUrl}
                        alt={oi.menu.name}
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-medium text-gray-900 truncate">{oi.menu.name}</div>
                        <div className="text-sm text-gray-500">Qty: {oi.quantity}</div>
                      </div>
                      <div className="text-base font-semibold text-gray-900">₹{oi.menu.price * oi.quantity}</div>
                    </div>
                  ))}
                </div>
                
                {order.orderItems.length > 3 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                      className="w-full text-center text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors duration-200"
                    >
                      {expanded[order.id] ? 'Show Less' : `+${order.orderItems.length - 3} More Items`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default AdminDeliveredOrders;


