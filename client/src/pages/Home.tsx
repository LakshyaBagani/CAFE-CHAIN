import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';
import { useVegMode } from '../context/VegModeContext';
import { useCart } from '../context/CartContext';
import { useCafe } from '../context/CafeContext';
import { useRestaurant } from '../context/RestaurantContext';
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
  const { setSelectedCafe, userHasSelectedCafe, isInitialized } = useCafe();
  const { restaurants, fetchRestaurants, fetchMenu, getRestaurantStatus } = useRestaurant();

  useEffect(() => {
    if (restaurants.length === 0) {
      fetchRestaurants();
    }
  }, [restaurants.length, fetchRestaurants]);

  const [trendingMenus, setTrendingMenus] = useState<MenuItem[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [lastRestoId, setLastRestoId] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const cartCounts = useMemo(() => {
    const counts: { [key: number]: number } = {};
    cartItems.forEach(item => {
      counts[item.id] = (counts[item.id] || 0) + item.quantity;
    });
    return counts;
  }, [cartItems]);

  const filteredTrendingMenus = useMemo(() => {
    return vegMode 
      ? trendingMenus.filter(menuItem => menuItem.veg)
      : trendingMenus;
  }, [trendingMenus, vegMode]);

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
    
    const categoriesWithItems = Object.entries(grouped)
      .filter(([items]) => items.length > 0)
      .reduce((acc, [category, items]) => {
        acc[category] = items;
        return acc;
      }, {} as Record<string, MenuItem[]>);
    
    return categoriesWithItems;
  }, [allMenuItems, vegMode]);

  useEffect(() => {
    if (isInitialized && restoId && restoId !== lastRestoId && restaurants.length > 0) {
      const restaurant = restaurants.find(r => r.id === parseInt(restoId));
      if (restaurant) {
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
          setCurrentRestaurant(restaurant.id);
          setLastRestoId(restoId);
        } else {
          setLastRestoId(restoId);
        }
      }
    }
  }, [isInitialized, restoId, restaurants, userHasSelectedCafe, setSelectedLocation, setSelectedCafe, lastRestoId]);

  useEffect(() => {
    if (selectedLocation && !trendingLoading && !fetchingRef.current) {
      console.log("Selected location changed, fetching fresh menu data...", selectedLocation);
      fetchTrendingMenus();
    }
  }, [selectedLocation?.id]);

  const fetchTrendingMenus = async () => {
    if (!selectedLocation || trendingLoading || fetchingRef.current) {
      console.log("Skipping fetchTrendingMenus - no location, already loading, or already fetching");
      return;
    }
    
    const restoId = selectedLocation.id;
    
    console.log("Fetching fresh trending menus for location:", selectedLocation.location, "restoId:", restoId);
    fetchingRef.current = true;
    setTrendingLoading(true);
    
    try {
      const menuItems = await fetchMenu(restoId);
      setAllMenuItems(menuItems);
      setTrendingMenus(menuItems.slice(0, 6));
    } catch (error) {
      console.error('Error fetching menu:', error);
      setAllMenuItems([]);
      setTrendingMenus([]);
    } finally {
      setTrendingLoading(false);
      fetchingRef.current = false;
    }
  };

  return (
    <div className="pb-6 bg-gradient-to-br from-gray-50 via-orange-50/30 to-amber-50/20 min-h-screen">
      <div className="max-w-7xl mx-auto">
      <style>{`
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
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
            transform: scale(0.85) rotate(-5deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(251, 146, 60, 0.4), 0 0 40px rgba(251, 146, 60, 0.2);
          }
          50% {
            box-shadow: 0 0 30px rgba(251, 146, 60, 0.6), 0 0 60px rgba(251, 146, 60, 0.3);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg); }
          75% { transform: rotate(3deg); }
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }

        .category-card {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: scaleIn 0.6s ease backwards;
          position: relative;
          overflow: visible;
        }

        .category-card::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(135deg, transparent, rgba(251, 146, 60, 0.3), transparent);
          border-radius: 1rem;
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: -1;
        }

        .category-card:hover::before {
          opacity: 1;
          animation: shimmer 2s ease-in-out infinite;
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
          transform: translateY(-8px) scale(1.08) rotate(2deg);
          filter: brightness(1.1);
        }

        .category-card:active {
          transform: translateY(-4px) scale(1.02);
        }

        .menu-card {
          animation: fadeInUp 0.7s ease backwards;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }

        .menu-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.5), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .menu-card:hover::after {
          opacity: 1;
          animation: shimmer 1.5s ease-in-out;
        }

        .menu-card:hover {
          transform: translateY(-8px) scale(1.03);
          box-shadow: 0 20px 40px rgba(251, 146, 60, 0.25), 0 10px 20px rgba(0, 0, 0, 0.1);
        }

        .menu-card:nth-child(1) { animation-delay: 0.1s; }
        .menu-card:nth-child(2) { animation-delay: 0.15s; }
        .menu-card:nth-child(3) { animation-delay: 0.2s; }
        .menu-card:nth-child(4) { animation-delay: 0.25s; }
        .menu-card:nth-child(5) { animation-delay: 0.3s; }

        .promo-banner {
          animation: fadeInUp 0.8s ease;
          background: linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ea580c 100%);
          position: relative;
          overflow: hidden;
          box-shadow: 0 15px 40px rgba(245, 158, 11, 0.3), 0 5px 15px rgba(0, 0, 0, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .promo-banner::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: shimmer 8s linear infinite;
        }

        .promo-banner::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
          animation: shimmer 3s ease-in-out infinite;
        }

        .promo-float {
          animation: gentleFloat 3s ease-in-out infinite;
        }

        .menu-image {
          transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .menu-card:hover .menu-image {
          transform: scale(1.15) rotate(2deg);
        }

        .hot-badge {
          animation: pulseGlow 2s ease-in-out infinite;
          background: linear-gradient(135deg, #f59e0b, #f97316);
        }

        .trending-title {
          background: linear-gradient(135deg, #f97316, #fb923c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 30px rgba(251, 146, 60, 0.3);
        }

        .category-icon {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .category-card:hover .category-icon {
          animation: wiggle 0.5s ease-in-out;
        }

        .add-button {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }

        .add-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .add-button:hover::before {
          width: 300px;
          height: 300px;
        }

        .add-button:hover {
          transform: scale(1.1);
          box-shadow: 0 5px 15px rgba(251, 146, 60, 0.4);
        }

        .price-tag {
          background: linear-gradient(135deg, #f97316, #fb923c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 900;
          position: relative;
        }

        .sparkle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #fbbf24;
          border-radius: 50%;
          animation: sparkle 2s ease-in-out infinite;
        }

        .section-header {
          animation: slideInRight 0.6s ease;
          position: relative;
          display: inline-block;
        }

        .section-header::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, #f97316, transparent);
          border-radius: 2px;
        }

        .veg-badge {
          background: linear-gradient(135deg, #10b981, #059669);
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        .category-badge {
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
          transition: all 0.3s ease;
        }

        .menu-card:hover .category-badge {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .category-card:hover {
            transform: translateY(-6px) scale(1.05);
          }
          
          .menu-card:hover {
            transform: translateY(-6px) scale(1.02);
          }
        }
      `}</style>

      {/* Promotional Banner */}
      <div className="px-4 pt-4 pb-2">
        <div className="promo-banner rounded-3xl shadow-2xl overflow-hidden">
          <div className="relative px-6 py-8 text-white">
            <div className="relative z-10 text-center">
              <div className="promo-float inline-block mb-3">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white border-opacity-30">
                  <Zap className="w-8 h-8 text-yellow-300 drop-shadow-lg" />
                </div>
              </div>
              <h3 className="text-3xl font-extrabold mb-2 drop-shadow-2xl tracking-tight">Flash Sale!</h3>
              <p className="text-lg mb-4 font-semibold opacity-95 drop-shadow-lg">Get 20% off on your first order</p>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="bg-white bg-opacity-25 backdrop-blur-md px-4 py-2 rounded-xl border border-white border-opacity-30 shadow-lg">
                  <span className="text-2xl font-bold drop-shadow-lg">02:45:32</span>
                </div>
              </div>
              <button className="bg-white text-orange-700 px-8 py-3 rounded-full text-base font-bold hover:bg-yellow-300 hover:text-orange-800 transition-all duration-300 shadow-2xl hover:shadow-yellow-300/50 transform hover:scale-110 relative overflow-hidden group">
                <span className="relative z-10">Claim Offer Now</span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Categories */}
      <div className="px-4 py-6 lg:px-8 lg:py-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-header text-2xl font-extrabold text-gray-900">What's on your mind?</h2>
          <button className="text-sm text-amber-600 font-bold hover:text-amber-700 transition-all hover:scale-110">
            See all →
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
              <div className={`category-icon w-22 h-19 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xl ${category.shadow} group-hover:shadow-2xl overflow-hidden border-2 border-white border-opacity-50`}>
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-full h-full object-cover object-center rounded-2xl transition-transform duration-500"
                />
              </div>
              <span className="text-xs font-bold text-gray-700 group-hover:text-amber-600 transition-all">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Trending Section */}
      {selectedLocation && getRestaurantStatus(selectedLocation.id).isOpen && (
        <>
          <div className="px-4 py-2 lg:px-8 lg:py-1">
            <div className="flex items-center space-x-3 mb-6">
              <Flame className="w-6 h-6 text-orange-500 drop-shadow-lg" />
              <h2 className="trending-title text-2xl font-extrabold">Trending Now</h2>
              <div className="sparkle" style={{top: '10px', left: '150px', animationDelay: '0s'}}></div>
              <div className="sparkle" style={{top: '5px', left: '170px', animationDelay: '1s'}}></div>
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
                          className="menu-card bg-white rounded-2xl shadow-xl border-2 border-orange-100 overflow-hidden snap-start shrink-0 grow-0 basis-[calc(50%-0.5rem)] lg:basis-auto lg:h-72 lg:flex lg:flex-col"
                        >
                          {/* Image */}
                          <div className="relative border-2 border-orange-50 rounded-xl overflow-hidden lg:flex-shrink-0">
                            <img
                              src={menuItem.imageUrl}
                              alt={menuItem.name}
                              className="menu-image w-full h-32 object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/200x128?text=No+Image';
                              }}
                            />
                            {menuItem.availability === false && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                <span className="bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                                  Unavailable
                                </span>
                              </div>
                            )}
                            {index < 3 && (
                              <div className="hot-badge absolute top-2 left-2 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center space-x-1 border border-white border-opacity-30">
                                <TrendingUp className="w-3 h-3" />
                                <span>HOT</span>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-3 lg:flex-1 lg:flex lg:flex-col lg:justify-between">
                            <div className="mb-3">
                              <h3 className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                                {menuItem.name}
                              </h3>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {menuItem.description}
                              </p>
                              <div className="flex items-center space-x-1 mt-2">
                                <span className="category-badge text-xs text-gray-700 px-2 py-1 rounded-full font-semibold">
                                  {menuItem.category}
                                </span>
                                {menuItem.veg && (
                                  <span className="veg-badge text-xs text-white px-2 py-1 rounded-full font-semibold">
                                    🌱 Veg
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="price-tag text-xl">
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
                                  className={`add-button flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${menuItem.availability === false ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg'}`}
                                >
                                  <Plus className="w-3 h-3 relative z-10" />
                                  <span className="relative z-10">Add</span>
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
                    <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <span className="text-3xl">🌱</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vegetarian Items</h3>
                    <p className="text-gray-600 mb-4">No vegetarian options available at this location</p>
                    <button 
                      onClick={() => setVegMode(false)}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Show All Items
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
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
        </>
      )}

      {/* Category Sections */}
      {selectedLocation && getRestaurantStatus(selectedLocation.id).isOpen && (
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
          {Object.entries(menuItemsByCategory).map(([category, items]) => (
            <div key={category} className="mb-8 lg:px-4 lg:mb-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="section-header text-2xl font-extrabold text-gray-900 flex items-center">
                  <Utensils className="w-6 h-6 mr-2 text-amber-600" />
                  {category}
                </h2>
                <Link
                  to={`/category/${category}/${selectedLocation.id}`}
                  className="text-sm text-amber-600 font-bold hover:text-amber-700 transition-all hover:scale-110"
                >
                  See all →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 lg:gap-6">
                {items.slice(0, 4).map((menuItem) => {
                  const cartCount = cartCounts[menuItem.id] || 0;
                  return (
                    <div
                      key={menuItem.id}
                      className="menu-card bg-white rounded-2xl shadow-xl border-2 border-orange-100 overflow-hidden snap-start shrink-0 grow-0 basis-[calc(50%-0.5rem)] lg:basis-auto lg:h-72 lg:flex lg:flex-col"
                    >
                      <div className="relative border-2 border-orange-50 rounded-xl overflow-hidden lg:flex-shrink-0">
                        <img
                          src={menuItem.imageUrl}
                          alt={menuItem.name}
                          className="menu-image w-full h-32 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/200x128?text=No+Image';
                          }}
                        />
                        {menuItem.availability === false && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                            <span className="bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                              Unavailable
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-3 lg:flex-1 lg:flex lg:flex-col lg:justify-between">
                        <div className="mb-3">
                          <h3 className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                            {menuItem.name}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {menuItem.description}
                          </p>
                          <div className="flex items-center space-x-1 mt-2">
                            <span className="category-badge text-xs text-gray-700 px-2 py-1 rounded-full font-semibold">
                              {menuItem.category}
                            </span>
                            {menuItem.veg && (
                              <span className="veg-badge text-xs text-white px-2 py-1 rounded-full font-semibold">
                                🌱 Veg
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="price-tag text-xl">
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
                              className={`add-button flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${menuItem.availability === false ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg'}`}
                            >
                              <Plus className="w-3 h-3 relative z-10" />
                              <span className="relative z-10">Add</span>
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

      {/* Restaurant Closed Message */}
      {selectedLocation && !getRestaurantStatus(selectedLocation.id).isOpen && (
        <div className="text-center py-16 px-4">
          <div className="bg-gradient-to-br from-white via-red-50/30 to-orange-50/30 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-red-200/50 p-12 max-w-lg mx-auto transform hover:scale-105 transition-all duration-500">
            <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-inner">
                <Utensils className="w-8 h-8 text-white" style={{animation: 'gentleFloat 2s ease-in-out infinite'}} />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-3xl font-extrabold text-gray-900 mb-2">Restaurant is Closed</h3>
              <p className="text-gray-600 text-lg leading-relaxed font-medium">
                {selectedLocation.name} is currently closed. Please check back later.
              </p>
              
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-100 to-orange-100 text-red-800 rounded-full text-sm font-bold shadow-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                Currently Closed
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Menu Found Message */}
      {selectedLocation && getRestaurantStatus(selectedLocation.id).isOpen && Object.keys(menuItemsByCategory).length === 0 && !trendingLoading && (
        <div className="text-center py-16 px-4">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-blue-200/50 p-12 max-w-lg mx-auto transform hover:scale-105 transition-all duration-500">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-inner">
                <Utensils className="w-8 h-8 text-white" style={{animation: 'gentleFloat 2s ease-in-out infinite'}} />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-3xl font-extrabold text-gray-900 mb-2">No Menu Found</h3>
              <p className="text-gray-600 text-lg leading-relaxed font-medium">
                No menu items are available at {selectedLocation.name} right now.
              </p>
              
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-sm font-bold shadow-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                Menu Unavailable
              </div>
            </div>
          </div>
        </div>
      )}

      </div> 
    </div>
  );
};

export default Home;