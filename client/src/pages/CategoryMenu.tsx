import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';
import { useCart } from '../context/CartContext';
import { useRestaurant } from '../context/RestaurantContext';
import QuantitySelector from '../components/QuantitySelector';
import { ArrowLeft, Plus, Utensils, ShoppingCart } from 'lucide-react';
// axios removed - using centralized context

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  veg: boolean;
  category: string;
  availability?: boolean;
}

const CategoryMenu: React.FC = () => {
  const { category, userId } = useParams<{ category: string; userId: string }>();
  const { } = useLocation();
  const { addItem, removeItem, updateQuantity, items: cartItems, setCurrentRestaurant } = useCart();
  const { getRestaurantStatus, getCachedCategoryMenu } = useRestaurant();
  const navigate = useNavigate();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoize cart counts for performance
  const cartCounts = useMemo(() => {
    const counts: { [key: number]: number } = {};
    cartItems.forEach(item => {
      counts[item.id] = (counts[item.id] || 0) + item.quantity;
    });
    return counts;
  }, [cartItems]);

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }

    // Set current restaurant for cart management
    setCurrentRestaurant(parseInt(userId));

    // Only read from cached per-category menu prepared at Home/RestaurantContext
    setLoading(true);
    try {
      const items = category ? getCachedCategoryMenu(parseInt(userId), category) : [];
      setMenuItems(items || []);
    } catch (error) {
      console.error('Error reading cached category menu:', error);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId, category, navigate]);

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description,
      imageUrl: item.imageUrl,
      restaurantId: parseInt(userId || '0'),
      restaurantName: `Restaurant ${userId}` // Use userId instead of selectedLocation
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <div className="bg-white/95 backdrop-blur-sm shadow-md border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="w-16 h-8 bg-amber-200 rounded-lg animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-white/30 overflow-hidden animate-pulse">
                <div className="flex p-4 space-x-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-5 bg-gray-200 rounded w-16"></div>
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Compact Header */}
      <div className="bg-white/95 backdrop-blur-sm shadow-md border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-amber-700 hover:text-amber-800 transition-colors bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-lg font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h1 className="text-lg font-bold text-gray-900 flex items-center">
              <Utensils className="w-5 h-5 mr-2 text-amber-600" />
              {category}
            </h1>
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-gray-700">{menuItems.length} items</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Menu Items */}
        {menuItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Utensils className="w-10 h-10 text-amber-600" />
              </div>
              {(() => {
                const restaurantStatus = getRestaurantStatus(parseInt(userId!));
                if (!restaurantStatus.isOpen) {
                  return (
                    <>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Restaurant is Closed</h3>
                      <p className="text-gray-600 mb-6">
                        This restaurant is currently closed. Please check back later.
                      </p>
                    </>
                  );
                } else {
                  return (
                    <>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">No {category} Items Found</h3>
                      <p className="text-gray-600 mb-6">
                        No {category} items are available at this location right now.
                      </p>
                    </>
                  );
                }
              })()}
              <button
                onClick={() => navigate('/')}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Browse All Items
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
            {menuItems.map((item) => {
              const cartCount = cartCounts[item.id] || 0;
              return (
                <div key={item.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg hover:border-orange-300 hover:-translate-y-1 transition-all duration-200 group snap-start shrink-0 grow-0 basis-[calc(50%-0.5rem)]">
                  {/* Image */}
                  <div className="relative border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/200x128?text=No+Image';
                      }}
                    />
                    {item.availability === false && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Unavailable
                        </span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="bg-white/90 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-3">
                    {/* Name and Description */}
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    
                    {/* Price and Add Button */}
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-amber-600">
                        ₹{item.price}
                      </div>
                      {cartCount > 0 ? (
                        <QuantitySelector
                          quantity={cartCount}
                          onIncrease={() => handleAddToCart(item)}
                          onDecrease={() => {
                            if (cartCount === 1) {
                              removeItem(item.id);
                            } else {
                              updateQuantity(item.id, cartCount - 1);
                            }
                          }}
                          size="small"
                        />
                      ) : (
                        <button
                          onClick={() => handleAddToCart(item)}
                          disabled={item.availability === false}
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${item.availability === false ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryMenu;