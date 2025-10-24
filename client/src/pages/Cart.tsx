import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  ArrowLeft,
  CheckCircle,
  MapPin,
  Home,
  ChevronDown
} from 'lucide-react';

const Cart: React.FC = () => {
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice, getTotalItems } = useCart();
  const navigate = useNavigate();
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [deliveryType, setDeliveryType] = useState('');
  const [showDeliveryDropdown, setShowDeliveryDropdown] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleQuantityChange = (id: number, change: number) => {
    const currentQuantity = items.find(item => item.id === id)?.quantity || 0;
    const newQuantity = currentQuantity + change;
    
    if (newQuantity <= 0) {
      removeItem(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleOrderPlacement = async () => {
    if (items.length === 0) return;
    
    
    setIsProcessingPayment(true);
    
    try {
      // Get restaurant ID from first item
      const restaurantId = items[0].restaurantId;
      
      // Prepare order data
      const orderData = {
        totalPrice: getTotalAmount(),
        deliveryType: deliveryType,
        paymentMethod: "UPI", // Default payment method
        orderItems: items.map(item => ({
          dishName: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      };
      

      const response = await fetch(`https://cafe-chain.onrender.com/user/resto/${restaurantId}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        clearCart();
        setCheckoutStep(3);
        
        // Store order ID for tracking
        if (data.order && data.order.id) {
          localStorage.setItem('latestOrderId', data.order.id.toString());
        }
        
        // Show success toast with order details
        const { showToast } = await import('../utils/toast');
        const orderDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        showToast(`Order placed successfully on ${orderDate}!`, 'success');
      } else {
        const { showToast } = await import('../utils/toast');
        showToast(data.message || 'Order failed', 'error');
        throw new Error(data.message || 'Order failed');
      }
    } catch (error: any) {
      const { showToast } = await import('../utils/toast');
      showToast(`Order placement failed: ${error?.message || 'Unknown error'}. Please try again.`, 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getDeliveryFee = () => {
    return deliveryType === 'room' ? 25 : 0;
  };

  const getSubtotal = () => {
    return getTotalPrice() + getDeliveryFee();
  };

  const getSGST = () => {
    return getSubtotal() * 0.025; // 2.5%
  };

  const getCGST = () => {
    return getSubtotal() * 0.025; // 2.5%
  };

  const getTotalTax = () => {
    return getSGST() + getCGST();
  };

  const getTotalAmount = () => {
    return getSubtotal() + getTotalTax();
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some delicious items to get started!</p>
          <button
            onClick={() => navigate('/')}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  if (checkoutStep === 3) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
            <CheckCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-8">
            Your order has been confirmed and will be prepared shortly.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => {
                // Get the latest order ID from localStorage or navigate to general tracking
                const latestOrderId = localStorage.getItem('latestOrderId');
                if (latestOrderId) {
                  navigate(`/track-order/${latestOrderId}`);
                } else {
                  navigate('/track-orders');
                }
              }}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Track Your Order
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600">{getTotalItems()} items in your cart</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex space-x-4">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/80x80?text=No+Image';
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.restaurantName}</p>
                      </div>
                      <span className="text-lg font-bold text-amber-600">₹{item.price}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Products</span>
                <span>₹{getTotalPrice().toFixed(2)}</span>
              </div>
              {deliveryType === 'room' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Room Delivery Fee</span>
                  <span>₹{getDeliveryFee().toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">SGST (2.5%)</span>
                  <span>₹{getSGST().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">CGST (2.5%)</span>
                  <span>₹{getCGST().toFixed(2)}</span>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Amount</span>
                  <span className="text-amber-600">
                    ₹{getTotalAmount().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {checkoutStep === 1 && (
              <button
                onClick={() => setCheckoutStep(2)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                Proceed to Checkout
              </button>
            )}

            {checkoutStep === 2 && (
              <div className="space-y-4">
                {/* Delivery Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Type
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowDeliveryDropdown(!showDeliveryDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white"
                    >
                      <span className="flex items-center space-x-2">
                        {deliveryType === 'takeaway' ? (
                          <>
                            <Home className="h-4 w-4" />
                            <span>Take Away</span>
                          </>
                        ) : deliveryType === 'room' ? (
                          <>
                            <MapPin className="h-4 w-4" />
                            <span>Room Delivery (₹25)</span>
                          </>
                        ) : (
                          <span className="text-gray-500">Select delivery type</span>
                        )}
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showDeliveryDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showDeliveryDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        <button
                          onClick={() => {
                            setDeliveryType('takeaway');
                            setShowDeliveryDropdown(false);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50"
                        >
                          <Home className="h-4 w-4" />
                          <span>Take Away</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeliveryType('room');
                            setShowDeliveryDropdown(false);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50"
                        >
                          <MapPin className="h-4 w-4" />
                          <span>Room Delivery (₹25)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>


                {/* Order Button */}
                <button
                  onClick={handleOrderPlacement}
                  disabled={isProcessingPayment || !deliveryType}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span>Place Order</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
