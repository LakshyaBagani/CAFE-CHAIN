import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { 
  Star, 
  Clock, 
  MapPin, 
  Plus, 
  Minus, 
  ChefHat,
  Heart,
  Share2,
  Search
} from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category: string;
}

interface Restaurant {
  id: number;
  name: string;
  location: string;
  rating: number;
  deliveryTime: string;
  imageUrl: string;
  description: string;
}

const Restaurant: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cartItems, setCartItems] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    if (id) {
      fetchRestaurantData();
    }
  }, [id]);

  const fetchRestaurantData = async () => {
    try {
      // Always fetch fresh restaurant data - no caching
      const restaurantResponse = await fetch(`https://cafe-chain.onrender.com/admin/allResto`);
      const restaurantData = await restaurantResponse.json();
      
      if (restaurantData.success) {
        const foundRestaurant = restaurantData.restaurants.find((r: any) => r.id === parseInt(id!));
        if (foundRestaurant) {
          setRestaurant({
            id: foundRestaurant.id,
            name: foundRestaurant.name,
            location: foundRestaurant.location,
            rating: 4.5 + Math.random() * 0.5,
            deliveryTime: `${Math.floor(Math.random() * 30) + 15} min`,
            imageUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.random() * 1000000000}?w=800&h=400&fit=crop`,
            description: "Experience the finest cuisine with our carefully crafted menu featuring fresh ingredients and traditional recipes."
          });
        }
      }

      // SWR with versioning for menu
      const cacheKey = `menu_${id}`;
      const versionKey = `menu_${id}_version`;
      const cachedMenuStr = localStorage.getItem(cacheKey);
      const cachedVersionStr = localStorage.getItem(versionKey);

      if (cachedMenuStr) {
        // Immediate render from cache on reload (no skeleton)
        try {
          const cachedMenu = JSON.parse(cachedMenuStr);
          if (Array.isArray(cachedMenu)) {
            const list = [...cachedMenu];
            list.sort((a: any, b: any) => Number(b.availability !== false) - Number(a.availability !== false));
            setMenuItems(list);
            setLoading(false);
          }
        } catch (e) {
          console.warn('[Restaurant] Failed to parse cached menu for', id, e);
        }

        // Silent background version check; update if increased
        try {
          const versionRes = await axios.get(`https://cafe-chain.onrender.com/admin/resto/${id}/getMenuVersion`, { withCredentials: true });
          const currentVersion = versionRes?.data?.menuVersion ?? 0;
          const cachedVersion = cachedVersionStr ? parseInt(cachedVersionStr) : 0;
          if (currentVersion > cachedVersion) {
            const freshRes = await axios.get(`https://cafe-chain.onrender.com/user/resto/${id}/menu?t=${Date.now()}`, { withCredentials: true });
            if (freshRes.data?.success) {
              const freshList = Array.isArray(freshRes.data.menu) ? [...freshRes.data.menu] : [];
              freshList.sort((a: any, b: any) => Number(b.availability !== false) - Number(a.availability !== false));
              setMenuItems(freshList);
              try {
                localStorage.setItem(cacheKey, JSON.stringify(freshList));
                localStorage.setItem(versionKey, String(currentVersion));
              } catch {}
            }
          } else {
          }
        } catch (verErr) {
          console.warn('[Restaurant] Version check failed', verErr);
        }
      } else {
        // No cache: fetch fresh, then store menu and version
        const menuRes = await axios.get(`https://cafe-chain.onrender.com/user/resto/${id}/menu`, { withCredentials: true });
        if (menuRes.data?.success) {
          const list = Array.isArray(menuRes.data.menu) ? [...menuRes.data.menu] : [];
          list.sort((a: any, b: any) => Number(b.availability !== false) - Number(a.availability !== false));
          setMenuItems(list);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(list));
          } catch {}
          try {
            const versionRes = await axios.get(`https://cafe-chain.onrender.com/admin/resto/${id}/getMenuVersion`, { withCredentials: true });
            if (versionRes?.data?.menuVersion != null) {
              localStorage.setItem(versionKey, String(versionRes.data.menuVersion));
            }
          } catch (e) {
            console.warn('[Restaurant] Failed to fetch/store version on first fetch', e);
          }
        } else {
          setMenuItems([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch restaurant data:', error);
    } finally {
      // If we rendered from cache above, loading was already set false.
      setLoading(false);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      ...item,
      restaurantId: restaurant?.id || 0,
      restaurantName: restaurant?.name || ''
    });
    
    setCartItems(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1
    }));
  };

  const handleUpdateQuantity = (itemId: number, change: number) => {
    const newQuantity = Math.max(0, (cartItems[itemId] || 0) + change);
    setCartItems(prev => ({
      ...prev,
      [itemId]: newQuantity
    }));
  };

  const categories = ['All', ...new Set(menuItems.map(item => item.category))];
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Restaurant not found</h2>
        <Link to="/" className="text-amber-600 hover:text-amber-500">
          Back to restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Restaurant Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="relative h-64">
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-6 left-6 text-white">
            <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
            <p className="text-lg mb-4">{restaurant.description}</p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-1">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <span className="font-semibold">{restaurant.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-5 w-5" />
                <span>{restaurant.deliveryTime}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="h-5 w-5" />
                <span>{restaurant.location}</span>
              </div>
            </div>
          </div>
          <div className="absolute top-6 right-6 flex space-x-2">
            <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors">
              <Heart className="h-5 w-5" />
            </button>
            <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search menu items..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex space-x-4">
              <div className="relative">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                />
                {item && (item as any).availability === false && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                    <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                      Unavailable
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <span className="text-lg font-bold text-amber-600">₹{item.price}</span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {item.category}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    {cartItems[item.id] > 0 ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{cartItems[item.id]}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={(item as any).availability === false}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${(item as any).availability === false ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {menuItems.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-12 max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ChefHat className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">No Menu Found</h3>
            <p className="text-gray-600 mb-6">
              No menu items are available at this restaurant right now.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}
      {menuItems.length > 0 && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
          <p className="text-gray-500">Try adjusting your search or category filter</p>
        </div>
      )}

      {/* Cart Summary */}
      {Object.values(cartItems).some(qty => qty > 0) && (
        <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Cart Summary</h3>
            <Link to="/cart" className="text-amber-600 hover:text-amber-500 text-sm">
              View Cart
            </Link>
          </div>
          <div className="space-y-2">
            {Object.entries(cartItems).map(([itemId, quantity]) => {
              if (quantity === 0) return null;
              const item = menuItems.find(i => i.id === parseInt(itemId));
              if (!item) return null;
              return (
                <div key={itemId} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{item.name} x{quantity}</span>
                  <span className="font-medium">₹{(item.price * quantity).toFixed(2)}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-amber-600">
                ₹{Object.entries(cartItems).reduce((total, [itemId, quantity]) => {
                  const item = menuItems.find(i => i.id === parseInt(itemId));
                  return total + (item ? item.price * quantity : 0);
                }, 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Restaurant;
