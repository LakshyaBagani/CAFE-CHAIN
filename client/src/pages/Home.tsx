import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useLocation } from '../context/LocationContext';
import { useVegMode } from '../context/VegModeContext';
import { useCart } from '../context/CartContext';
import { useCafe } from '../context/CafeContext';
import QuantitySelector from '../components/QuantitySelector';
import { 
  MapPin, 
  TrendingUp,
  Zap,
  Flame,
  Plus,
  Utensils
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Restaurant {
  id: number;
  name: string;
  location: string;
  rating: number;
  deliveryTime: string;
  imageUrl: string;
  isOpen: boolean;
}

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

const Home: React.FC = () => {
  const { restoId } = useParams<{ restoId: string }>();
  const { selectedLocation, setSelectedLocation } = useLocation();
  const { vegMode, setVegMode } = useVegMode();
  const { addItem, removeItem, updateQuantity, items: cartItems, setCurrentRestaurant } = useCart();
  const { selectedCafe, setSelectedCafe, userHasSelectedCafe, isInitialized } = useCafe();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [trendingMenus, setTrendingMenus] = useState<MenuItem[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [lastRestoId, setLastRestoId] = useState<string | null>(null);

  // Calculate cart counts for each menu item
  const cartCounts = useMemo(() => {
    const counts: { [key: number]: number } = {};
    cartItems.forEach(item => {
      counts[item.id] = (counts[item.id] || 0) + item.quantity;
    });
    return counts;
  }, [cartItems]);

  // Memoize filtered menus to prevent unnecessary re-renders
  const filteredTrendingMenus = useMemo(() => {
    return vegMode 
      ? trendingMenus.filter(menuItem => menuItem.veg)
      : trendingMenus;
  }, [trendingMenus, vegMode]);

  // Group menu items by category - only show categories with items
  const menuItemsByCategory = useMemo(() => {
    const filteredItems = vegMode 
      ? allMenuItems.filter(menuItem => menuItem.veg)
      : allMenuItems;
    
    const grouped = filteredItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
    
    // Filter out categories with no items
    const categoriesWithItems = Object.entries(grouped)
      .filter(([items]) => items.length > 0)
      .reduce((acc, [category, items]) => {
        acc[category] = items;
        return acc;
      }, {} as Record<string, MenuItem[]>);
    
    return categoriesWithItems;
  }, [allMenuItems, vegMode]);

  // Clear old cache entries (keep only last 5 locations)
  const clearOldCache = () => {
    const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('menu_'));
    if (cacheKeys.length > 5) {
      // Remove oldest entries
      const sortedKeys = cacheKeys.sort((a, b) => {
        const timestampA = localStorage.getItem(`${a}_timestamp`) || '0';
        const timestampB = localStorage.getItem(`${b}_timestamp`) || '0';
        return parseInt(timestampA) - parseInt(timestampB);
      });
      
      const keysToRemove = sortedKeys.slice(0, cacheKeys.length - 5);
      console.log(selectedCafe);
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        localStorage.removeItem(key.replace('menu_', 'menuVersion_'));
        localStorage.removeItem(`${key}_timestamp`);
      });
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // Handle restoId from URL - only when context is initialized and user hasn't selected yet
  useEffect(() => {
    if (isInitialized && restoId && restaurants.length > 0 && restoId !== lastRestoId) {
      const restaurant = restaurants.find(r => r.id === parseInt(restoId));
      if (restaurant) {
        // Only switch if user hasn't made a selection yet
        if (!userHasSelectedCafe) {
          
          setSelectedLocation({
            id: restaurant.id,
            name: restaurant.name,
            location: restaurant.location
          });
          setSelectedCafe({
            id: restaurant.id,
            name: restaurant.name,
            location: restaurant.location
          });
          setCurrentRestaurant(restaurant.id); // Set current restaurant for cart management
          setLastRestoId(restoId);
        } else {
          // User has selected a cafe, just update the lastRestoId to prevent re-triggering
          setLastRestoId(restoId);
        }
      }
    }
  }, [isInitialized, restoId, restaurants, userHasSelectedCafe, setSelectedLocation, setSelectedCafe, lastRestoId]);

  useEffect(() => {
    if (selectedLocation && !trendingLoading) {
      fetchTrendingMenus();
    }
  }, [selectedLocation]);

  // Load cached menu immediately on mount if available
  useEffect(() => {
    if (selectedLocation) {
      const cachedData = localStorage.getItem(`menu_${selectedLocation.location}`);
      const cachedVersionStr = localStorage.getItem(`menu_${selectedLocation.id}_version`);
      if (cachedData) {
        try {
          const cachedMenu = JSON.parse(cachedData);
          const hasAvailability = Array.isArray(cachedMenu) && cachedMenu.every((i: any) => 'availability' in i);
          if (hasAvailability) {
            setTrendingMenus(cachedMenu.slice(0, 6));
            // Always check version in background on reload
            void refreshIfVersionChanged(selectedLocation.id, selectedLocation.location, cachedVersionStr ? parseInt(cachedVersionStr) : 0);
          }
        } catch (error) {
          console.error('Error parsing cached menu:', error);
        }
      }
    }
  }, [selectedLocation]);

  // Preload menus for all locations on app start
  // Remove all-restaurants preload; rely on Layout's gated fetch with cache
  useEffect(() => {}, []);

  // Fetch menu when a location is selected
  useEffect(() => {
    if (selectedLocation) {
      fetchCafeMenu(selectedLocation.id);
    }
  }, [selectedLocation]);



  const fetchRestaurants = async () => {
    try {
      // Always fetch fresh data on reload - no caching
      const response = await axios.get('https://cafe-chain.onrender.com/admin/allResto');
      const data = response.data;
      if (data.success && data.resto) {
        const restaurantImage = 'https://b.zmtcdn.com/data/pictures/chains/3/20510753/b4533531eeccdb350c04fe047280aac6.jpg?fit=around|960:500&crop=960:500;*,*';
        const mockRestaurants = data.resto.map((resto: any) => ({
          id: resto.id,
          name: resto.name,
          location: resto.location,
          rating: 4.5 + Math.random() * 0.5,
          deliveryTime: `${Math.floor(Math.random() * 30) + 15} min`,
          imageUrl: restaurantImage,
          isOpen: Math.random() > 0.2
        }));
        setRestaurants(mockRestaurants);
      }
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    }
  };

  // Fetch menu for the selected cafe
  const fetchCafeMenu = async (restoId: number) => {
    try {
      const response = await axios.get(`https://cafe-chain.onrender.com/user/resto/${restoId}/menu`, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        console.log(`Menu for cafe ${restoId}:`, response.data.menu);
        return response.data.menu;
      }
    } catch (error) {
      console.error(`Failed to fetch menu for cafe ${restoId}:`, error);
    }
    return [];
  };

  const fetchTrendingMenus = async () => {
    if (!selectedLocation) return;
    
    const locationKey = selectedLocation.location;
    const restoId = selectedLocation.id;
    const cachedVersionStr = localStorage.getItem(`menu_${restoId}_version`);
    
    // Check localStorage cache first - use 5-minute cache
    const cachedData = localStorage.getItem(`menu_${locationKey}`);
    const cachedTimestamp = localStorage.getItem(`menu_${locationKey}_timestamp`);
    
    if (cachedData && cachedTimestamp) {
      const cacheAge = Date.now() - parseInt(cachedTimestamp);
      if (cacheAge < 5 * 60 * 1000) { // 5 minutes
        try {
          const cachedMenu = JSON.parse(cachedData);
          const hasAvailability = Array.isArray(cachedMenu) && cachedMenu.every((i: any) => 'availability' in i);
          if (hasAvailability) {
            setAllMenuItems(cachedMenu);
            setTrendingMenus(cachedMenu.slice(0, 6));
            // Background version check every time
            void refreshIfVersionChanged(restoId, locationKey, cachedVersionStr ? parseInt(cachedVersionStr) : 0);
            return;
          }
        } catch (error) {
          console.error('Error parsing cached menu:', error);
        }
      }
    }
    
    // Fetch fresh menu
    await fetchAndCacheMenu(locationKey, restoId);
    // After fetching, also persist current version value
    try {
      const versionRes = await axios.get(`https://cafe-chain.onrender.com/admin/resto/${restoId}/getMenuVersion`, { withCredentials: true });
      if (versionRes?.data?.menuVersion != null) {
        localStorage.setItem(`menu_${restoId}_version`, String(versionRes.data.menuVersion));
      }
    } catch {}
  };

  const fetchAndCacheMenu = async (locationKey: string, restoId: number) => {
    setTrendingLoading(true);
    try {
      const response = await axios.get(`https://cafe-chain.onrender.com/user/resto/${restoId}/menu`, {
        withCredentials: true
      });
      
      const data = response.data;
      
      if (data.success) {
        // Process menu items
        const allMenuItems = data.menu.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description,
          imageUrl: item.imageUrl,
          veg: item.veg,
          category: item.category,
          availability: item.availability
        }));
        // Sort: available first, unavailable last
        allMenuItems.sort((a: any, b: any) => {
          const avA = a.availability !== false; // treat undefined as available
          const avB = b.availability !== false;
          return Number(avB) - Number(avA);
        });
        
        
        // Cache in localStorage with timestamp
        localStorage.setItem(`menu_${locationKey}`, JSON.stringify(allMenuItems));
        localStorage.setItem(`menu_${locationKey}_timestamp`, Date.now().toString());
        
        // Cache with timestamp only - no version check needed
        
        // Clear old cache entries
        clearOldCache();
        
                    // Set all menu items for category sections
                    setAllMenuItems(allMenuItems);
                    
                    // Set trending items (first 6)
                    setTrendingMenus(allMenuItems.slice(0, 6));
        
      }
    } catch (error) {
      console.error('Error fetching trending menus:', error);
    } finally {
      setTrendingLoading(false);
    }
  };

  // Background version check and refresh if increased
  const refreshIfVersionChanged = async (restoId: number, locationKey: string, cachedVersion: number) => {
    try {
      const versionRes = await axios.get(`https://cafe-chain.onrender.com/admin/resto/${restoId}/getMenuVersion`, { withCredentials: true });
      const currentVersion = versionRes?.data?.menuVersion ?? 0;
      if (currentVersion > cachedVersion) {
        await fetchAndCacheMenu(locationKey, restoId);
        try {
          localStorage.setItem(`menu_${restoId}_version`, String(currentVersion));
        } catch {}
      }
    } catch {
      // ignore version check errors
    }
  };



  return (
    <div className="pb-6 bg-gray-50">
      {/* Main container with max width for large screens only */}
      <div className="max-w-7xl mx-auto">
      <style>{`
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes subtleGlow {
          0%, 100% {
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.2);
          }
          50% {
            box-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
          }
        }

        @keyframes softPulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.9;
          }
          50% { 
            transform: scale(1.02);
            opacity: 1;
          }
        }

        .category-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: scaleIn 0.5s ease backwards;
        }

        .category-card:nth-child(1) { animation-delay: 0.05s; }
        .category-card:nth-child(2) { animation-delay: 0.1s; }
        .category-card:nth-child(3) { animation-delay: 0.15s; }
        .category-card:nth-child(4) { animation-delay: 0.2s; }
        .category-card:nth-child(5) { animation-delay: 0.25s; }
        .category-card:nth-child(6) { animation-delay: 0.3s; }
        .category-card:nth-child(7) { animation-delay: 0.35s; }
        .category-card:nth-child(8) { animation-delay: 0.4s; }

        .category-card:hover {
          transform: translateY(-6px) scale(1.05);
          animation: subtleGlow 2s ease-in-out infinite;
        }

        .category-card:active {
          transform: translateY(-3px) scale(1.02);
        }

        .restaurant-card {
          animation: fadeInUp 0.6s ease backwards;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .restaurant-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
        }

        .restaurant-card:nth-child(1) { animation-delay: 0.1s; }
        .restaurant-card:nth-child(2) { animation-delay: 0.2s; }
        .restaurant-card:nth-child(3) { animation-delay: 0.3s; }
        .restaurant-card:nth-child(4) { animation-delay: 0.4s; }

        .promo-banner {
          animation: fadeInUp 0.8s ease;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.8) 0%, rgba(234, 88, 12, 0.8) 100%);
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(245, 158, 11, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .promo-banner::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%);
          animation: shimmer 8s infinite;
        }

        .promo-float {
          animation: gentleFloat 3s ease-in-out infinite;
        }

        .restaurant-image {
          transition: transform 0.5s ease;
          filter: brightness(1) contrast(1);
        }

        .restaurant-card:hover .restaurant-image {
          transform: scale(1.05);
          filter: brightness(1.05);
        }

        .badge-glow {
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
        }

        .star-glow {
          filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.4));
        }

        .heart-icon {
          transition: all 0.3s ease;
        }

        .heart-icon:hover {
          color: #ef4444;
          transform: scale(1.2);
        }

        .category-icon {
          transition: transform 0.3s ease;
        }

        .category-card:hover .category-icon {
          transform: rotate(5deg) scale(1.1);
        }

        .trending-title {
          text-shadow: 0 0 4px rgba(251, 146, 60, 0.3);
        }

        .hot-badge {
          animation: softPulse 3s ease-in-out infinite;
          box-shadow: 0 0 8px rgba(251, 146, 60, 0.4);
        }
      `}</style>

      {/* Promotional Banner */}
      <div className="px-4 pt-4 pb-2">
        <div className="promo-banner rounded-2xl shadow-xl overflow-hidden">
          <div className="relative px-6 py-8 text-white">
            <div className="relative z-10 text-center">
              <div className="promo-float inline-block mb-3">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Zap className="w-8 h-8 text-yellow-300" />
                </div>
              </div>
              <h3 className="text-3xl font-extrabold mb-2 drop-shadow-lg">Flash Sale!</h3>
              <p className="text-lg mb-4 font-medium opacity-95">Get 20% off on your first order</p>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-lg">
                  <span className="text-2xl font-bold">02:45:32</span>
                </div>
              </div>
              <button className="bg-white text-orange-700 px-8 py-3 rounded-full text-base font-bold hover:bg-yellow-300 hover:text-orange-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                Claim Offer Now
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Quick Categories */}
      <div className="px-4 py-6 lg:px-8 lg:py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">What's on your mind?</h2>
          <button className="text-sm text-amber-600 font-semibold hover:text-amber-700 transition-colors">
            See all
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { name: 'Roll', color: 'from-red-400 to-red-500', shadow: 'shadow-red-200' , image : "https://t4.ftcdn.net/jpg/10/43/52/27/360_F_1043522752_anZIFImv2LtkMbYD0h6C02X2T1B8FZmL.webp" },
            { name: 'Burger', color: 'from-orange-400 to-orange-500', shadow: 'shadow-orange-200', image: 'https://b.zmtcdn.com/data/pictures/chains/3/20510753/b4533531eeccdb350c04fe047280aac6.jpg?fit=around|960:500&crop=960:500;*,*&crop=center' },
            { name: 'Sandwich', color: 'from-yellow-400 to-yellow-500', shadow: 'shadow-yellow-200' , image : "https://media.istockphoto.com/id/1397193477/photo/club-sandwich-made-with-bacon-ham-turkey-cheese-lettuce-and-tomato.jpg?s=612x612&w=0&k=20&c=fjNyxTEA0L88bqENs8_SKMnfAOyWlNPGxLIxz9nsSss=" },
            { name: 'Omelette', color: 'from-amber-400 to-amber-500', shadow: 'shadow-amber-200' , image : "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/06/cheese-omelette-mozarella-omelette.jpg" },
            { name: 'Maggie', color: 'from-blue-400 to-blue-500', shadow: 'shadow-blue-200' , image : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUDUsGVGBR-qbYIiQEZBMwJt1Lro1cOMCV3A&s" },
            { name: 'Mocktail', color: 'from-pink-400 to-pink-500', shadow: 'shadow-pink-200' , image : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5cUYYbX3pDJq1ZkL356chg05-1hmXDHmK-A&s"},
            { name: 'Fries', color: 'from-purple-400 to-purple-500', shadow: 'shadow-purple-200' , image : "https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?cs=srgb&dl=pexels-dzeninalukac-1583884.jpg&fm=jpg" },
            { name: 'Drinks', color: 'from-gray-400 to-gray-500', shadow: 'shadow-gray-200' , image : "https://www.shutterstock.com/image-photo/heart-shaped-latte-art-white-600nw-2506388167.jpg" }
          ].map((category, index) => (
            <Link
              key={index}
              to={`/category/${category.name}/${selectedLocation?.id || 1}`}
              className="category-card text-center group block"
            >
              <div className={`w-22 h-19 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg ${category.shadow} group-hover:shadow-xl overflow-hidden`}>
                { (
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-full object-cover object-center rounded-2xl"
                  />
                ) }
              </div>
              <span className="text-xs font-semibold text-gray-700 group-hover:text-amber-600 transition-colors">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Trending Section */}
      <div className="px-4 py-2 lg:px-8 lg:py-1">
        <div className="flex items-center space-x-2 mb-4">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-bold text-gray-900 trending-title">Trending Now</h2>
        </div>
      </div>


      {/* Trending Menu Items */}
      <div className="px-4 pb-4 lg:px-8 lg:pb-3">
        {selectedLocation ? (
          <div className="space-y-4">
            {filteredTrendingMenus.length > 0 && !trendingLoading ? (
              <div className="flex gap-4 overflow-x-auto pb-1 snap-x snap-mandatory lg:grid lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 lg:gap-6 lg:overflow-x-visible">
                {filteredTrendingMenus.slice(0, 5).map((menuItem, index) => {
                  const cartCount = cartCounts[menuItem.id] || 0;
                  return (
                    <div
                      key={menuItem.id}
                      className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden group hover:shadow-lg hover:border-orange-300 transition-all duration-200 hover:-translate-y-1 snap-start shrink-0 grow-0 basis-[calc(50%-0.5rem)] lg:basis-auto lg:h-72 lg:flex lg:flex-col"
                    >
                      {/* Image */}
                      <div className="relative border border-gray-200 rounded-lg overflow-hidden lg:flex-shrink-0">
                        <img
                          src={menuItem.imageUrl}
                          alt={menuItem.name}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/200x128?text=No+Image';
                          }}
                        />
                        {menuItem.availability === false && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              Unavailable
                            </span>
                          </div>
                        )}
                        {/* HOT badge */}
                        {index < 3 && (
                          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>HOT</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-3 lg:flex-1 lg:flex lg:flex-col lg:justify-between">
                        {/* Name and Description */}
                        <div className="mb-3">
                          <h3 className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                            {menuItem.name}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {menuItem.description}
                          </p>
                          <div className="flex items-center space-x-1 mt-2">
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                              {menuItem.category}
                            </span>
                            {menuItem.veg && (
                              <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                🌱 Veg
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price and Add Button */}
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-orange-600">
                            ₹{menuItem.price}
                          </div>
                          {cartCount > 0 ? (
                            <QuantitySelector
                              quantity={cartCount}
                              onIncrease={() => addItem({
                                id: menuItem.id,
                                name: menuItem.name,
                                price: menuItem.price,
                                description: menuItem.description,
                                imageUrl: menuItem.imageUrl,
                                restaurantId: selectedLocation?.id || 0,
                                restaurantName: selectedLocation?.name || 'Unknown'
                              })}
                              onDecrease={() => {
                                if (cartCount === 1) {
                                  removeItem(menuItem.id);
                                } else {
                                  updateQuantity(menuItem.id, cartCount - 1);
                                }
                              }}
                              size="small"
                            />
                          ) : (
                            <button
                              onClick={() => addItem({
                                id: menuItem.id,
                                name: menuItem.name,
                                price: menuItem.price,
                                description: menuItem.description,
                                imageUrl: menuItem.imageUrl,
                                restaurantId: selectedLocation?.id || 0,
                                restaurantName: selectedLocation?.name || 'Unknown'
                              })}
                              disabled={menuItem.availability === false}
                              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${menuItem.availability === false ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
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
            ) : vegMode && trendingMenus.length > 0 && filteredTrendingMenus.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌱</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vegetarian Items</h3>
                <p className="text-gray-600 mb-4">No vegetarian options available at this location</p>
                <button 
                  onClick={() => setVegMode(false)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Show All Items
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Always show skeleton when no data or loading */}
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden animate-pulse">
                    <div className="flex items-start space-x-4 p-4">
                      <div className="w-24 h-24 bg-gray-200 rounded-xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="flex space-x-2">
                          <div className="h-6 bg-gray-200 rounded w-16"></div>
                          <div className="h-6 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Please select a location to see trending items</p>
          </div>
        )}
      </div>

      {/* Category Sections */}
      {selectedLocation && (
        <div className="px-4 pb-4">
          {Object.keys(menuItemsByCategory).length === 0 && trendingLoading && (
            <>
              {Array.from({ length: 2 }).map((_, idx) => (
                <div key={idx} className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((__, i) => (
                      <div key={i} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden animate-pulse">
                        <div className="h-32 bg-gray-200" />
                        <div className="p-3 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-2/3" />
                          <div className="h-3 bg-gray-200 rounded w-3/4" />
                          <div className="flex items-center justify-between mt-2">
                            <div className="h-5 bg-gray-200 rounded w-16" />
                            <div className="h-6 bg-gray-200 rounded w-14" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
          {Object.keys(menuItemsByCategory).length === 0 && !trendingLoading && selectedLocation && (
            <div className="text-center py-16">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-12 max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Utensils className="w-10 h-10 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">No Menu Found</h3>
                <p className="text-gray-600 mb-6">
                  No menu items are available at {selectedLocation.name} right now.
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
          {Object.entries(menuItemsByCategory).map(([category, items]) => (
            <div key={category} className="mb-8 lg:px-4 lg:mb-4">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Utensils className="w-5 h-5 mr-2 text-amber-600" />
                  {category}
                </h2>
                <Link
                  to={`/category/${category}/${selectedLocation.id}`}
                  className="text-sm text-amber-600 font-semibold hover:text-amber-700 transition-colors"
                >
                  See all
                </Link>
              </div>

              {/* Category Items Grid */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 lg:gap-6">
                {items.slice(0, 4).map((menuItem) => {
                  const cartCount = cartCounts[menuItem.id] || 0;
                  return (
                    <div
                      key={menuItem.id}
                      className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden group hover:shadow-lg hover:border-orange-300 transition-all duration-200 hover:-translate-y-1 snap-start shrink-0 grow-0 basis-[calc(50%-0.5rem)] lg:basis-auto lg:h-72 lg:flex lg:flex-col"
                    >
                      {/* Image */}
                      <div className="relative border border-gray-200 rounded-lg overflow-hidden lg:flex-shrink-0">
                        <img
                          src={menuItem.imageUrl}
                          alt={menuItem.name}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/200x128?text=No+Image';
                          }}
                        />
                        {menuItem.availability === false && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              Unavailable
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-3 lg:flex-1 lg:flex lg:flex-col lg:justify-between">
                        {/* Name and Description */}
                        <div className="mb-3">
                          <h3 className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                            {menuItem.name}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {menuItem.description}
                          </p>
                          <div className="flex items-center space-x-1 mt-2">
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                              {menuItem.category}
                            </span>
                            {menuItem.veg && (
                              <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                🌱 Veg
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price and Add Button */}
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-orange-600">
                            ₹{menuItem.price}
                          </div>
                          {cartCount > 0 ? (
                            <QuantitySelector
                              quantity={cartCount}
                              onIncrease={() => addItem({
                                id: menuItem.id,
                                name: menuItem.name,
                                price: menuItem.price,
                                description: menuItem.description,
                                imageUrl: menuItem.imageUrl,
                                restaurantId: selectedLocation?.id || 0,
                                restaurantName: selectedLocation?.name || 'Unknown'
                              })}
                              onDecrease={() => {
                                if (cartCount === 1) {
                                  removeItem(menuItem.id);
                                } else {
                                  updateQuantity(menuItem.id, cartCount - 1);
                                }
                              }}
                              size="small"
                            />
                          ) : (
                            <button
                              onClick={() => addItem({
                                id: menuItem.id,
                                name: menuItem.name,
                                price: menuItem.price,
                                description: menuItem.description,
                                imageUrl: menuItem.imageUrl,
                                restaurantId: selectedLocation?.id || 0,
                                restaurantName: selectedLocation?.name || 'Unknown'
                              })}
                              disabled={menuItem.availability === false}
                              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${menuItem.availability === false ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
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
            </div>
          ))}
        </div>
      )}

      </div> {/* Close main container */}
    </div>
  );
};

export default Home;