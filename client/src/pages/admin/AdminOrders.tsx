import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Eye,
  RefreshCw,
  Filter,
  Search,
  DollarSign,
  User,
  Coffee
} from 'lucide-react';

interface OrderItem {
  id: number;
  menu: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
  };
  quantity: number;
}

interface Order {
  id: number;
  totalPrice: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  orderItems: OrderItem[];
  user: {
    id: number;
    name: string;
    email: string;
  };
  restaurant: {
    id: number;
    name: string;
  };
}

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Mock data for demo
      const mockOrders: Order[] = [
        {
          id: 1,
          totalPrice: 45.99,
          status: 'delivered',
          paymentMethod: 'cash',
          createdAt: '2024-01-15T10:30:00Z',
          orderItems: [
            {
              id: 1,
              menu: {
                id: 1,
                name: 'Grilled Chicken Breast',
                price: 18,
                imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100&h=100&fit=crop'
              },
              quantity: 2
            },
            {
              id: 2,
              menu: {
                id: 2,
                name: 'Caesar Salad',
                price: 12,
                imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=100&h=100&fit=crop'
              },
              quantity: 1
            }
          ],
          user: {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com'
          },
          restaurant: {
            id: 1,
            name: 'Downtown Bistro'
          }
        },
        {
          id: 2,
          totalPrice: 32.50,
          status: 'preparing',
          paymentMethod: 'card',
          createdAt: '2024-01-15T14:20:00Z',
          orderItems: [
            {
              id: 3,
              menu: {
                id: 3,
                name: 'Chocolate Cake',
                price: 8,
                imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&h=100&fit=crop'
              },
              quantity: 1
            },
            {
              id: 4,
              menu: {
                id: 4,
                name: 'Fresh Orange Juice',
                price: 5,
                imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=100&h=100&fit=crop'
              },
              quantity: 2
            }
          ],
          user: {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com'
          },
          restaurant: {
            id: 2,
            name: 'Garden Cafe'
          }
        },
        {
          id: 3,
          totalPrice: 28.75,
          status: 'pending',
          paymentMethod: 'wallet',
          createdAt: '2024-01-15T16:45:00Z',
          orderItems: [
            {
              id: 5,
              menu: {
                id: 5,
                name: 'Margherita Pizza',
                price: 15,
                imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=100&h=100&fit=crop'
              },
              quantity: 1
            },
            {
              id: 6,
              menu: {
                id: 6,
                name: 'Garlic Bread',
                price: 8,
                imageUrl: 'https://images.unsplash.com/photo-1572441713132-51c75654db73?w=100&h=100&fit=crop'
              },
              quantity: 1
            }
          ],
          user: {
            id: 3,
            name: 'Mike Johnson',
            email: 'mike@example.com'
          },
          restaurant: {
            id: 3,
            name: 'Pizza Palace'
          }
        }
      ];
      
      setOrders(mockOrders);
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'preparing':
        return <RefreshCw className="h-5 w-5 text-blue-500" />;
      case 'ready':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      // Here you would call the API to update order status
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));
      const { showToast } = await import('../../utils/toast');
      showToast(`Order status updated to ${newStatus}`, 'success');
    } catch (error) {
      const { showToast } = await import('../../utils/toast');
      showToast('Failed to update order status. Please try again.', 'error');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toString().includes(searchQuery) ||
                         order.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.restaurant.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = ['All', 'pending', 'preparing', 'ready', 'delivered', 'cancelled'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
        <p className="text-gray-600">Track and manage all orders across your restaurants</p>
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
              placeholder="Search orders..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.status)}
                    <span className="text-lg font-semibold text-gray-900">
                      Order #{order.id}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-600">₹{order.totalPrice.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Customer</span>
                  </h4>
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">{order.user.name}</p>
                    <p className="text-sm text-gray-600">{order.user.email}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <Coffee className="h-4 w-4" />
                    <span>Restaurant</span>
                  </h4>
                  <p className="font-medium text-gray-900">{order.restaurant.name}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Payment</span>
                  </h4>
                  <p className="font-medium text-gray-900 capitalize">{order.paymentMethod}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                <div className="space-y-2">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <img
                        src={item.menu.imageUrl}
                        alt={item.menu.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.menu.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-gray-900">
                        ₹{(item.menu.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'preparing')}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'ready')}
                      className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors"
                    >
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'delivered')}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                    >
                      Mark Delivered
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowOrderModal(true);
                  }}
                  className="flex items-center space-x-1 text-amber-600 hover:text-amber-500"
                >
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">View Details</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Order #{selectedOrder.id} Details
                </h3>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium">Name:</span> {selectedOrder.user.name}</p>
                      <p><span className="font-medium">Email:</span> {selectedOrder.user.email}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Order Information</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium">Restaurant:</span> {selectedOrder.restaurant.name}</p>
                      <p><span className="font-medium">Payment:</span> {selectedOrder.paymentMethod}</p>
                      <p><span className="font-medium">Status:</span> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.orderItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={item.menu.imageUrl}
                          alt={item.menu.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{item.menu.name}</h5>
                          <p className="text-sm text-gray-600">₹{item.menu.price} each</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">Qty: {item.quantity}</p>
                          <p className="font-bold text-amber-600">
                            ₹{(item.menu.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-amber-600">
                      ₹{selectedOrder.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
