import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  Calendar
} from 'lucide-react';

interface OrderItem {
  id: number;
  menu: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    resto: {
      id: number;
      name: string;
      location: string;
    };
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
  deliveryType?: string;
}

const SingleOrderTracking: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://cafe-chain.onrender.com/user/orderHistory', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && data.orders) {
        const foundOrder = data.orders.find((o: Order) => o.id.toString() === orderId);
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          setError('Order not found');
        }
      } else {
        setError('Failed to load order');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'preparing':
        return <Package className="h-6 w-6 text-blue-500" />;
      case 'prepared':
        return <Truck className="h-6 w-6 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      default:
        return <Clock className="h-6 w-6 text-gray-500" />;
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-2 animate-pulse">
              <div className="h-5 w-5 bg-gray-300 rounded"></div>
              <div className="h-5 bg-gray-300 rounded w-24"></div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Profile</span>
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <Package className="h-12 w-12 mx-auto mb-2" />
              <p className="text-lg font-semibold">Order not found</p>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Get restaurant info from first order item
  const restaurant = order.orderItems.length > 0 ? order.orderItems[0].menu.resto : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-orange-200/50 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Profile</span>
              </button>
            </div>
            <div className="text-center">
            </div>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-orange-100/50 p-8 hover:shadow-2xl transition-all duration-300">
          {/* Order Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl">
                {getStatusIcon(order.status)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Order #{order.id}</h3>
                <p className="text-sm text-gray-600 font-medium">{restaurant?.name || 'Restaurant'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                ₹{order.totalPrice}
              </p>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl">
              <div className="p-2 bg-orange-100 rounded-xl">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Order Date</p>
                <p className="font-semibold text-gray-900">{orderDate}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
              <div className="p-2 bg-green-100 rounded-xl">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Payment</p>
                <p className="font-semibold text-gray-900">{order.paymentMethod}</p>
              </div>
            </div>
            {order.deliveryType && (
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Truck className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Delivery</p>
                  <p className="font-semibold text-gray-900">{order.deliveryType}</p>
                </div>
              </div>
            )}
          </div>

          {/* Status Progress - Enhanced Vertical Layout */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mr-4"></div>
              <h4 className="text-lg font-bold text-gray-800">Order Progress</h4>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-6">
              <div className="flex flex-col space-y-6">
                {[
                  { key: 'pending', label: 'Order Placed', completed: true },
                  { key: 'preparing', label: 'Preparing', completed: ['preparing', 'prepared', 'delivered'].includes(order.status.toLowerCase()) },
                  { key: 'prepared', label: 'Ready', completed: ['prepared', 'delivered'].includes(order.status.toLowerCase()) },
                  { key: 'delivered', label: 'Delivered', completed: order.status.toLowerCase() === 'delivered' }
                ].map((step, index) => (
                  <div key={step.key} className="flex items-start group">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 ${
                        step.completed 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-200' 
                          : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-500'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : (
                          <Clock className="h-6 w-6" />
                        )}
                      </div>
                      {index < 3 && (
                        <div className={`w-1 h-12 mt-3 rounded-full transition-all duration-500 ${
                          step.completed ? 'bg-gradient-to-b from-green-500 to-emerald-600' : 'bg-gradient-to-b from-gray-200 to-gray-300'
                        }`} />
                      )}
                    </div>
                    <div className="ml-6 flex-1 flex items-center justify-between h-12">
                      <p className={`text-lg font-semibold transition-colors duration-300 ${
                        step.completed ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {step.label}
                      </p>
                      {step.completed && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                          ✓ Done
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <div className="flex items-center mb-6">
              <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mr-4"></div>
              <h4 className="text-lg font-bold text-gray-800">Order Items</h4>
            </div>
            <div className="space-y-4">
              {order.orderItems.map((item, itemIndex) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between bg-gradient-to-r from-white to-gray-50 rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100"
                  style={{ animationDelay: `${itemIndex * 50}ms` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={item.menu.imageUrl}
                        alt={item.menu.name}
                        className="w-16 h-16 rounded-2xl object-cover shadow-md"
                      />
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {item.quantity}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{item.menu.name}</p>
                      <p className="text-sm text-gray-600">₹{item.menu.price} each</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      ₹{item.menu.price * item.quantity}
                    </p>
                    <p className="text-sm text-gray-500">Total</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleOrderTracking;
